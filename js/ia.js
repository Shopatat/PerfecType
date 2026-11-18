/* Les deux IA de PerfecType :
   - Claude réécrit le texte (clé Anthropic de l'utilisateur, appel direct depuis le navigateur).
   - La transcription de la voix passe par un service Whisper (Groq ou OpenAI), ou par la dictée du navigateur en secours.
   Les clés restent dans ce navigateur (localStorage) et ne partent que vers le service concerné. */
import Anthropic from "./vendor/anthropic.mjs";

export const MODELES = {
  "claude-opus-5-5": "Opus 5.5 (le plus fin)",
  "claude-sonnet-5-5": "Sonnet 5.5 (équilibré)",
  "claude-haiku-5-5": "Haiku 5.5 (le plus rapide, le moins cher)"
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
  const c = getClient(cle);
  if (!c) throw new IAErreur("no_key", "Ajoute ta clé Claude dans les Réglages.");
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
    if (e instanceof Anthropic.AuthenticationError) throw new IAErreur("bad_key", "La clé Claude est refusée. Vérifie-la dans les Réglages.");
    if (e instanceof Anthropic.PermissionDeniedError) throw new IAErreur("bad_key", "Cette clé Claude n'a pas accès à ce modèle.");
    if (e instanceof Anthropic.RateLimitError) throw new IAErreur("rate_limited", "Trop de demandes d'un coup. Réessaie dans quelques secondes.");
    if (e instanceof Anthropic.NotFoundError) throw new IAErreur("model", "Modèle introuvable. Change de modèle dans les Réglages.");
    if (e instanceof Anthropic.APIConnectionError) throw new IAErreur("network", "Pas de connexion à Claude. Vérifie ton réseau.");
    if (e instanceof Anthropic.APIError) throw new IAErreur("api", "Claude a renvoyé une erreur (" + (e.status || "?") + "). Réessaie.");
    throw new IAErreur("unknown", "Ça n'a pas marché. Réessaie.");
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
  if (!cle) throw new IAErreur("no_key", "Ajoute ta clé " + f.nom + " dans les Réglages.");
  const ext = /mp4|m4a|aac/.test(blob.type) ? "m4a" : /ogg/.test(blob.type) ? "ogg" : /wav/.test(blob.type) ? "wav" : "webm";
  const fd = new FormData();
  fd.append("file", blob, "dictee." + ext);
  fd.append("model", f.modele);
  fd.append("response_format", "json");
  fd.append("temperature", "0");
  if (langue) fd.append("language", langue);
  // Le « prompt » de Whisper oriente l'orthographe des noms propres : on y met le dictionnaire.
  if (vocabulaire && vocabulaire.length) fd.append("prompt", vocabulaire.slice(0, 60).join(", "));
  let r;
  try { r = await fetch(f.url, { method: "POST", headers: { Authorization: "Bearer " + cle }, body: fd, signal }); }
  catch (e) {
    if (signal && signal.aborted) throw new IAErreur("aborted", "");
    throw new IAErreur("network", "Pas de connexion à " + f.nom + ".");
  }
  if (r.status === 401 || r.status === 403) throw new IAErreur("bad_key", "La clé " + f.nom + " est refusée. Vérifie-la dans les Réglages.");
  if (r.status === 429) throw new IAErreur("rate_limited", f.nom + " dit : trop de demandes. Réessaie dans un instant.");
  if (!r.ok) throw new IAErreur("api", f.nom + " a renvoyé une erreur (" + r.status + ").");
  const j = await r.json();
  return (j.text || "").trim();
}

/* ===== Enregistreur micro ===== */
export function enregistreur() {
  let rec = null, flux = null, morceaux = [], ctxAudio = null, analyse = null;
  const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  return {
    dispo: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    actif: () => !!rec && rec.state === "recording",
    async demarrer() {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      morceaux = [];
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      rec.ondataavailable = e => { if (e.data && e.data.size) morceaux.push(e.data); };
      rec.start(250);
      try {
        ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        analyse = ctxAudio.createAnalyser(); analyse.fftSize = 256;
        ctxAudio.createMediaStreamSource(flux).connect(analyse);
      } catch { analyse = null; }
    },
    niveau() {
      if (!analyse) return 0;
      const d = new Uint8Array(analyse.frequencyBinCount); analyse.getByteTimeDomainData(d);
      let m = 0; for (const v of d) m = Math.max(m, Math.abs(v - 128));
      return Math.min(1, m / 64);
    },
    arreter() {
      return new Promise(res => {
        if (!rec) return res(null);
        rec.onstop = () => {
          const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
          flux.getTracks().forEach(t => t.stop());
          try { ctxAudio && ctxAudio.close(); } catch {}
          rec = null; flux = null; analyse = null; ctxAudio = null;
          res(blob.size > 1000 ? blob : null);
        };
        rec.stop();
      });
    },
    annuler() {
      if (!rec) return;
      rec.onstop = null; try { rec.stop(); } catch {}
      flux && flux.getTracks().forEach(t => t.stop());
      try { ctxAudio && ctxAudio.close(); } catch {}
      rec = null; flux = null; analyse = null; ctxAudio = null;
    }
  };
}

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
