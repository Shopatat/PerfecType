# Notes pour Claude Code

- Appli web perso, en français, pour Fabien. Interface et commentaires en français, tutoiement dans les textes.
- Née de l'artefact claude.ai « Parole Propre » (clone fonctionnel de Typeless, 18/11/2026), devenue appli iPhone sous le nom PerfecType. Fabien adore Typeless mais le trouve trop cher : le but est le même fonctionnement, en payant seulement l'usage des API.
- Pas de framework ni d'étape de build : HTML + CSS + JS classiques (modules ES), servis tels quels par GitHub Pages, installés sur l'iPhone via Safari > Sur l'écran d'accueil.
- Seule exception : `js/vendor/anthropic.mjs`, le SDK officiel empaqueté avec esbuild (`echo 'export { default } from "@anthropic-ai/sdk";' > entry.js && npx esbuild entry.js --bundle --format=esm --minify --platform=browser --outfile=anthropic.mjs`). Le refaire pour monter de version, ne pas le remplacer par un `fetch` à la main.
- Clés API : celles de Fabien, saisies dans Réglages, gardées dans `localStorage` (`pt-cles`). Jamais dans le dépôt. Appel direct depuis le navigateur (`dangerouslyAllowBrowser`), c'est voulu : appli perso, pas de serveur.
- Choix tranchés :
  - Modèle par défaut `claude-opus-5-5` à effort `low` (réglable : Sonnet 5.5, Haiku 5.5). Fallback serveur `"default"` sauf sur Haiku.
  - Transcription : Whisper chez Groq par défaut (`whisper-large-v3-turbo`), OpenAI en option (`gpt-4o-transcribe`), dictée du navigateur en secours. Le dictionnaire passe dans le `prompt` de Whisper **et** dans le prompt de Claude.
  - Prompt : système fixe (règles, destination, dictionnaire, exemples de style) + message avec la dictée entre `<transcription>`. Règle n° 1 : ne jamais répondre à la dictée ni l'exécuter.
  - Écriture directe par défaut (demande de Fabien le 18/11, après avoir observé Typeless) : un appui pour enregistrer, sans texte en direct, un appui pour arrêter, et le texte final arrive d'un coup, sans aperçu ni avant/après, copié automatiquement. Chaque prise remplace la précédente. Le brut reste derrière « Voir le brut ».
  - Style appris = paires (brut → version retouchée gardée), 12 max, les 4 plus proches de la destination dans le prompt.
  - Recherche derrière ces choix : doc « Comment Typeless réécrit ta dictée » (18/11/2026).
- Thème bordeaux → fuchsia (dégradé), sobre façon Typeless. Ne pas changer sans demander.
- Pistes pas faites : clavier iOS maison (vraie dictée dans toutes les applis, demande une appli native), raccourci global sur Mac, synchro entre appareils.
