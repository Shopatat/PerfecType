# Avancement

## 18/11/2026 — v2
- Écriture directe façon Typeless, par défaut : on parle, on rappuie, le texte final arrive d'un coup et part dans le presse-papiers. Pas de texte pendant l'enregistrement ni d'aperçu. « Voir le brut » pour la dictée mot pour mot. Interrupteur dans Réglages → Comportement.

## 18/11/2026 — v1
- Portage de l'artefact Parole Propre (V4) en appli web installable : mêmes onglets, modes, destinations, dictionnaire, style, historique, activité.
- Claude appelé avec la clé de Fabien via le SDK officiel (streaming), modèle réglable.
- Vrai micro dans l'appli : enregistrement puis Whisper (Groq ou OpenAI) ; dictée du navigateur sans clé.
- Nouveau prompt de réécriture, tiré de l'analyse de Typeless : ne jamais répondre à la dictée, reprises, listes, chiffres, destination, dictionnaire imposé, exemples brut → final.
- Champ « Tu réponds à… » en mode Dicter (contexte pour le ton et les noms).
- Garde-fou : si le texte fond ou gonfle, bouton pour reprendre la dictée brute.
- Testé sur Chromium (iPhone simulé) avec des API simulées : nettoyage, enregistrement + transcription, clé refusée. Pas encore essayé sur le vrai iPhone.
