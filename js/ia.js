/* Les deux IA de PerfecType :
   - Claude réécrit le texte (clé Anthropic de l'utilisateur, appel direct depuis le navigateur).
   - La transcription de la voix passe par un service Whisper (Groq ou OpenAI), ou par la dictée du navigateur en secours.
   Les clés restent dans ce navigateur (localStorage) et ne partent que vers le service concerné. */
// Le SDK est lourd : on ne le charge pas au lancement (l'appli s'ouvre plus vite), mais juste après, en tâche de fond.
let Anthropic = null;
const chargerSDK = () => Anthropic ? Promise.resolve(Anthropic) : import("./vendor/anthropic.mjs").then(m => (Anthropic = m.default));
export const prechargerSDK = () => chargerSDK().catch(() => {});

export const MODELES = {
  "claude-opus-5-5": "Opus 5.5",
  "claude-sonnet-5-5": "Sonnet 5.5",
  "claude-haiku-5-5": "Haiku 5.5"
};

let client = null, clientKey = "";
function getClient(cle) {
  if (!cle) return null;
  if (client && clientKey === cle) return client;
  client = new Anthropic({ apiKey: cle, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 60_000 });
  clientKey = cle;
  return client;
}

export class IAErreur extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/* Appelle Claude en streaming. onText reçoit le texte cumulé à chaque morceau. */
export async function claude({ cle, modele, systeme, message, maxTokens = 4000, effort = "low", signal, onText }) {
  try { await chargerSDK(); } catch { throw new IAErreur("network", "Pas de connexion à Claude."); }
  const c = getClient(cle);
  if (!c) throw new IAErreur("no_key", "Clé API Claude manquante.");
  const params = {
    model: modele,
    max_tokens: maxTokens,
    system: systeme,
    output_config: { effort },
    messages: [{ role: "user", content: message }]
  };
  // Haiku n'a pas de modèle de secours côté serveur ; Opus et Sonnet si.
  if (modele !== "claude-haiku-5-5") { params.betas = ["server-side-fallback-2026-07-01"]; params.fallbacks = "default"; }
  let cumul = "";
  try {
    const stream = c.beta.messages.stream(params, { signal });
    stream.on("text", t => { cumul += t; if (onText) onText(cumul); });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new IAErreur("refusal", "Claude a refusé ce texte.");
    const texte = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    return texte.trim();
  } catch (e) {
    if (e instanceof IAErreur) throw e;
    if (signal && signal.aborted) throw new IAErreur("aborted", "");
    if (e instanceof Anthropic.AuthenticationError) throw new IAErreur("bad_key", "Clé API Claude refusée.");
    if (e instanceof Anthropic.PermissionDeniedError) throw new IAErreur("bad_key", "Cette clé Claude n'a pas accès à ce modèle.");
    if (e instanceof Anthropic.RateLimitError) throw new IAErreur("rate_limited", "Trop de demandes. Nouvel essai possible dans quelques secondes.");
    if (e instanceof Anthropic.NotFoundError) throw new IAErreur("model", "Modèle introuvable.");
    if (e instanceof Anthropic.APIConnectionError) throw new IAErreur("network", "Pas de connexion à Claude.");
    if (e instanceof Anthropic.APIError) throw new IAErreur("api", "Claude a renvoyé une erreur (" + (e.status || "?") + ").");
    throw new IAErreur("unknown", "Une erreur est survenue.");
  }
}

/* ===== Transcription Whisper (Groq ou OpenAI, même format d'API) ===== */
export const STT = {
  groq: { nom: "Groq", url: "https://api.groq.com/openai/v1/audio/transcriptions", modele: "whisper-large-v3-turbo" },
  openai: { nom: "OpenAI", url: "https://api.openai.com/v1/audio/transcriptions", modele: "gpt-4o-transcribe" },
  navigateur: { nom: "Navigateur" }
};

export async function transcrire({ fournisseur, cle, blob, langue, vocabulaire, signal }) {
  const f = STT[fournisseur];
  if (!f || !f.url) throw new IAErreur("no_stt", "Pas de service de transcription choisi.");
  if (!cle) throw new IAErreur("no_key", "Clé API " + f.nom + " manquante.");
  const ext = /mp4|m4a|aac/.test(blob.type) ? "m4a" : /ogg/.test(blob.type) ? "ogg" : /wav/.test(blob.type) ? "wav" : "webm";
  const mo = blob.size < 1048576 ? Math.max(1, Math.round(blob.size / 1024)) + " Ko" : (blob.size / 1048576).toFixed(1).replace(".", ",") + " Mo";
  const fd = new FormData();
  fd.append("file", blob, "dictee." + ext);
  fd.append("model", f.modele);
  fd.append("response_format", "json");
  fd.append("temperature", "0");
  if (langue) fd.append("language", langue);
  // Le « prompt » de Whisper oriente l'orthographe des noms propres : on y met le dictionnaire.
  if (vocabulaire && vocabulaire.length) fd.append("prompt", vocabulaire.slice(0, 60).join(", "));
  // Délai max : un morceau fait au plus ~1 min 30 de voix, 90 s suffisent largement même en 4G faible.
  const ctrl = new AbortController(), minuteur = setTimeout(() => ctrl.abort("timeout"), 90_000);
  const stop = () => ctrl.abort("user"); if (signal) signal.addEventListener("abort", stop);
  let r;
  try { r = await fetch(f.url, { method: "POST", headers: { Authorization: "Bearer " + cle }, body: fd, signal: ctrl.signal }); }
  catch (e) {
    if (signal && signal.aborted) throw new IAErreur("aborted", "");
    if (ctrl.signal.aborted) throw new IAErreur("timeout", f.nom + " n'a pas répondu à temps (envoi de " + mo + ").");
    if (navigator.onLine === false) throw new IAErreur("offline", "Pas de réseau.");
    // fetch qui échoue sans réponse : réseau coupé pendant l'envoi, ou refus avant même d'entrer chez le service.
    throw new IAErreur("network", "L'envoi vers " + f.nom + " a coupé en route (" + mo + ").");
  } finally { clearTimeout(minuteur); if (signal) signal.removeEventListener("abort", stop); }
  let detail = "";
  if (!r.ok) { try { const j = await r.json(); detail = (j.error && j.error.message) || ""; } catch {} }
  if (r.status === 401 || r.status === 403) throw new IAErreur("bad_key", "Clé API " + f.nom + " refusée.");
  if (r.status === 413) throw new IAErreur("too_big", "Morceau trop gros pour " + f.nom + " (" + mo + ").");
  if (r.status === 429) throw new IAErreur("rate_limited", f.nom + " dit : quota atteint pour l'instant. " + (detail ? "(" + detail.slice(0, 140) + ")" : "Nouvel essai plus tard."));
  if (!r.ok) throw new IAErreur("api", f.nom + " a renvoyé une erreur " + r.status + (detail ? " : " + detail.slice(0, 140) : "."));
  const j = await r.json();
  return (j.text || "").trim();
}

/* ===== Enregistreur micro =====
   Les longues dictées sont coupées en morceaux d'environ une minute, de préférence dans un silence :
   chaque morceau part chez le service pendant que tu continues de parler. Un envoi raté ne coûte qu'un
   petit morceau (qu'on peut renvoyer), et à la fin il ne reste presque rien à envoyer. */
export function enregistreur() {
  let rec = null, flux = null, morceaux = [], ctxAudio = null, analyse = null, actif = false;
  let onMorceau = null, onProgres = null, dernierProgres = 0, departTotal = 0, debut = 0, index = 0, veille = null, garde = null, silence = 0;
  const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  const MIN = window.PT_MORCEAU_MIN || 40_000, MAX = window.PT_MORCEAU_MAX || 80_000;
  function niveau() {
    if (!analyse) return 0;
    const d = new Uint8Array(analyse.frequencyBinCount); analyse.getByteTimeDomainData(d);
    let m = 0; for (const v of d) m = Math.max(m, Math.abs(v - 128));
    return Math.min(1, m / 64);
  }
  function nouveau() {
    const m = []; morceaux = m;
    const opts = { audioBitsPerSecond: 48000 }; if (type) opts.mimeType = type;
    let r; try { r = new MediaRecorder(flux, opts); } catch { r = new MediaRecorder(flux, type ? { mimeType: type } : undefined); }
    r.ondataavailable = e => { if (e.data && e.data.size) m.push(e.data); };
    r.start(1000); rec = r; debut = Date.now(); silence = 0;
  }
  // Ferme le morceau en cours ; si on enregistre encore, le suivant démarre avant (léger chevauchement, aucun mot perdu).
  function couper() {
    const r = rec, m = morceaux, i = index++;
    const fini = new Promise(res => { r.onstop = () => res({ i, blob: new Blob(m, { type: r.mimeType || type || "audio/webm" }) }); });
    if (actif) nouveau();
    try { r.stop(); } catch {}
    return fini;
  }
  async function veiller() { try { veille = navigator.wakeLock ? await navigator.wakeLock.request("screen") : null; } catch { veille = null; } }
  return {
    dispo: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    actif: () => actif,
    // Lancée sans appui (écoute dès l'ouverture), l'analyse du son peut rester en pause sur iPhone : on ne dit alors pas « je n'entends rien ».
    audioOk: () => !!(ctxAudio && ctxAudio.state === "running"),
    async demarrer({ morceau, progres } = {}) {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      onMorceau = morceau || null; onProgres = progres || null; index = 0; actif = true; departTotal = Date.now(); dernierProgres = Date.now();
      try {
        ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        analyse = ctxAudio.createAnalyser(); analyse.fftSize = 256;
        ctxAudio.createMediaStreamSource(flux).connect(analyse);
        if (ctxAudio.state === "suspended") { ctxAudio.resume().catch(() => {}); document.addEventListener("pointerdown", () => ctxAudio && ctxAudio.resume().catch(() => {}), { once: true }); }
      } catch { analyse = null; }
      nouveau(); veiller();
      // L'écran qui se met en veille couperait le micro : on le garde allumé pendant la dictée.
      document.addEventListener("visibilitychange", veillerSiVisible);
      garde = setInterval(() => {
        if (!actif || !onMorceau) return;
        // Sauvegarde continue : toutes les 4 s, le morceau en cours (incomplet mais lisible) part au coffre.
        if (onProgres && Date.now() - dernierProgres > 4000 && morceaux.length) { dernierProgres = Date.now(); onProgres({ i: index, blob: new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" }) }); }
        const t = Date.now() - debut;
        silence = niveau() < 0.05 ? silence + 250 : 0;
        if ((t > MIN && silence >= 500) || t > MAX) couper().then(x => { if (x.blob.size > 1000) onMorceau(x); });
      }, 250);
    },
    niveau,
    duree: () => actif ? Date.now() - departTotal : 0,
    arreter() {
      if (!rec) return Promise.resolve(null);
      actif = false; clearInterval(garde);
      document.removeEventListener("visibilitychange", veillerSiVisible);
      return couper().then(x => {
        // Couper le micro et l'analyse du son fige l'iPhone un instant : on le fait après l'animation de retour du bouton.
        const f = flux, c = ctxAudio, w = veille;
        setTimeout(() => { if (f) f.getTracks().forEach(t => t.stop()); try { c && c.close(); } catch {} try { w && w.release(); } catch {} }, 1300);
        rec = null; flux = null; analyse = null; ctxAudio = null; veille = null;
        return x.blob.size > 1000 ? x : (x.i === 0 ? null : { i: x.i, blob: null });
      });
    },
    annuler() {
      if (!rec) return;
      actif = false; clearInterval(garde);
      rec.onstop = null; try { rec.stop(); } catch {}
      flux && flux.getTracks().forEach(t => t.stop());
      try { ctxAudio && ctxAudio.close(); } catch {}
      try { veille && veille.release(); } catch {}
      rec = null; flux = null; analyse = null; ctxAudio = null; veille = null;
    }
  };
  function veillerSiVisible() { if (actif && document.visibilityState === "visible") veiller(); }
}

/* ===== Coffre à dictées (IndexedDB) =====
   Chaque morceau enregistré y est rangé tant qu'il n'est pas transcrit : si l'envoi rate ou si l'appli
   se ferme, la dictée n'est pas perdue et on peut la renvoyer plus tard. */
const DB = "perfectype", STORE = "dictees";
function ouvrir() {
  return new Promise((res, rej) => {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => q.result.createObjectStore(STORE, { keyPath: "id" });
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
}
async function tx(mode, fn) {
  const db = await ouvrir();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), st = t.objectStore(STORE); let out;
    Promise.resolve(fn(st)).then(v => { out = v; });
    t.oncomplete = () => { db.close(); res(out); }; t.onerror = () => { db.close(); rej(t.error); };
  });
}
const req = q => new Promise((res, rej) => { q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
export const coffre = {
  async ranger(d) { try { await tx("readwrite", st => st.put(d)); } catch {} },
  async lire(id) { try { return await tx("readonly", st => req(st.get(id))); } catch { return null; } },
  async tous() { try { return (await tx("readonly", st => req(st.getAll()))) || []; } catch { return []; } },
  async oublier(id) { try { await tx("readwrite", st => st.delete(id)); } catch {} }
};

/* ===== Dictée du navigateur (secours, sans clé) ===== */
export function dicteeNavigateur() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  let r = null, fini = "", partiel = "";
  return {
    demarrer({ langue, onPartiel, onFin }) {
      r = new SR(); fini = ""; partiel = "";
      r.lang = langue === "en" ? "en-US" : "fr-FR";
      r.continuous = true; r.interimResults = true;
      r.onresult = e => {
        partiel = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) fini += (fini ? " " : "") + t.trim(); else partiel += t;
        }
        onPartiel && onPartiel(partiel);
      };
      r.onerror = e => { onFin && onFin(fini, e.error); };
      r.onend = () => { onFin && onFin(fini, null); r = null; };
      r.start();
    },
    arreter() { if (r) r.stop(); },
    actif: () => !!r
  };
}
