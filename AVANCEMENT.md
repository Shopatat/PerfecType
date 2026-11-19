# Avancement

## 19/11/2026 — v4
- Pendant l'écoute : barres qui suivent vraiment le micro, chrono, « J'écoute » ou « je n'entends rien », « Tout est sauvegardé sur ton téléphone » et le nombre de morceaux déjà transcrits.
- Sauvegarde continue : toutes les 4 s, ce qui a été dit part au coffre du téléphone, même au milieu d'un morceau. Si l'appli est fermée en pleine dictée, la dictée revient avec « Renvoyer ».
- Numéro de version en bas des Réglages (rubrique Données). Service worker en « réseau d'abord » : la dernière version est prise dès qu'il y a du réseau.

## 19/11/2026 — v3
- Fabien perdait ses longues dictées avec « Pas de connexion à Groq ». Maintenant : morceaux d'environ une minute envoyés pendant qu'il parle, 3 essais chacun, dictée gardée sur le téléphone tant qu'elle n'est pas transcrite, bouton « Renvoyer ma dictée » (aussi à la réouverture), écran gardé allumé.
- Messages d'erreur précis : réseau coupé pendant l'envoi (avec la taille), plus de réseau, délai dépassé, clé refusée, quota atteint (avec le détail de Groq), morceau trop gros.
- Testé sur Chromium avec une coupure réseau simulée, Groq en panne, rechargement de la page puis renvoi. Pas encore sur le vrai iPhone.

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
