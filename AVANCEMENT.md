# Avancement

## 19/11/2026 — v13
- « Voir le brut » retiré en écriture directe : on ne voit que le texte final, c'est plus magique (demande de Fabien). Le brut reste en mode classique (Écriture directe désactivée).

## 19/11/2026 — v12
- Pendant le travail, le message change : un verbe tiré au hasard (Je cisèle…, Je polis…, J'éclaircis…, Je fais briller…) qui se renouvelle toutes les 2 s en fondu. Pareil pendant la transcription (Je déchiffre…, Je mets en mots…). Idée de Fabien.

## 19/11/2026 — v11
- « Propre » devient « peaufiné » dans l'interface (Texte peaufiné, bouton Peaufiner, « Je peaufine… »), à la demande de Fabien : le texte n'est pas forcément raccourci, il peut aussi être développé.

## 19/11/2026 — v10
- Interface épurée : plus de police à chasse fixe ni de petites majuscules espacées, tous les titres d'encadrés dans la police arrondie. Retirés : l'explication sous les modes, le titre au-dessus du micro, la pastille « Exemple », « ou barre d'espace ».

## 19/11/2026 — v9
- Tout le fuchsia et le bordeaux deviennent le violet de l'écran d'écoute, en clair et en sombre (boutons, onglets, carte Activité, graphiques, bande du haut). Fonds légèrement lilas au lieu de rosés. Validé par Fabien sur aperçu.
- Nouvelle icône « L'onde chromée » en violet : barres en métal poli, deux petits éclats. Pour la voir, il faut supprimer et réajouter l'icône : exporter une sauvegarde avant, la restaurer après.

## 19/11/2026 — v8
- Mode sombre pour l'écoute : même violet, plus profond et plus doux (lueur et bouton atténués). Suit le réglage Apparence (Auto / Clair / Sombre).

## 19/11/2026 — v7
- Sauvegarde dans Réglages : exporter un fichier (réglages, dictionnaire, style, historique, activité, clés en option) et le restaurer. Né de la réinstallation de la v6 qui a effacé les données de Fabien.
- Vague plus fluide : le disque fait 240 px et il est agrandi par transform (Web Animations), puis un fond plein écran au même dégradé prend le relais en fondu. Plus de changement de theme-color pendant l'animation, lueur seulement sur le fond.

## 19/11/2026 — v6
- Le violet monte maintenant jusqu'en haut, autour de la Dynamic Island (barre d'état « black-translucent »). Au repos, une bande bordeaux → fuchsia derrière l'heure et le réseau (blancs) ; en sombre, la couleur du fond. Il faut réinstaller l'appli sur l'écran d'accueil pour que l'iPhone prenne ce réglage.

## 19/11/2026 — v5
- Écoute plein écran (idée de Fabien) : au départ, une vague violette part du micro et couvre tout l'écran ; pendant l'enregistrement, gros chrono, barres de niveau, état de la sauvegarde ; un appui n'importe où arrête, et la vague se rétracte vers le micro. Animation en `transform` seulement (fluide), barre d'état de l'iPhone passée en violet, version simple si « réduire les animations » est activé.

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
