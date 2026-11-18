# PerfecType

Tu parles, ça s'écrit propre. Une dictée vocale façon Typeless, mais à toi : les « euh », les redites et les « non pardon » disparaissent, la ponctuation arrive toute seule, et le ton s'adapte à la destination (mail, message, Slack, notes, LinkedIn…).
Appli web sans installation : du HTML, du CSS et du JavaScript, rien à compiler.

## Ce qu'il faut pour qu'elle marche

PerfecType appelle les IA directement depuis ton téléphone, avec **tes** clés (rangées seulement dans le navigateur) :

- **Claude** met le texte au propre. Clé à créer sur [platform.claude.com](https://platform.claude.com/settings/keys).
- **Groq** (ou OpenAI) transcrit ta voix avec Whisper. Groq a une offre gratuite : [console.groq.com/keys](https://console.groq.com/keys).
  Sans clé de transcription, l'appli essaie la dictée du navigateur, et sinon le micro du clavier de l'iPhone marche toujours.

Colle les clés dans **Réglages → Tes IA**, puis touche **Tester**.

## Mettre l'appli en ligne avec GitHub Pages

1. Dans le dépôt : **Settings → Pages**, source **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
2. Au bout d'une minute ou deux, l'appli est dispo sur `https://<ton-pseudo>.github.io/PerfecType/`.

## L'installer sur l'iPhone

Ouvre l'adresse dans **Safari**, touche **Partager**, puis **Sur l'écran d'accueil**.
L'appli s'ouvre en plein écran avec son icône. Elle s'ouvre hors ligne, mais il faut du réseau pour dicter (les IA sont en ligne).

## Comment ça marche

1. Tu touches le micro et tu parles. À la fin, l'enregistrement part chez Groq (Whisper), avec ton dictionnaire comme indice d'orthographe.
2. La transcription part chez Claude avec un prompt fixe : règles de nettoyage, destination choisie, dictionnaire, et quelques exemples de tes propres retouches (dictée brute → version que tu as gardée).
3. Le résultat arrive en direct. Tu peux le retoucher : PerfecType retient ta version comme exemple de style, et te propose d'ajouter les noms propres au dictionnaire.

Règle n° 1 du prompt : **ne jamais répondre** à ce que tu dictes. Si tu dictes une question, elle ressort comme une question bien écrite.
Garde-fou : si le résultat a fondu ou gonflé par rapport à ta dictée, un bouton propose de reprendre la dictée brute.

Modes : **Dicter**, **Traduire** (tu parles français, ça sort dans une autre langue), **Modifier** (tu colles un texte et tu dis quoi changer), **Demander** (une question, sur un texte collé ou non).
En Dicter, le champ « Tu réponds à… » accueille le message auquel tu réponds, pour que le ton et les noms suivent.

## Organisation des fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page : onglets Dicter, Activité, Historique, Réglages |
| `css/style.css` | Le style (bordeaux → fuchsia, clair et sombre) |
| `js/app.js` | Toute l'appli : modes, prompts, apprentissage, historique, activité |
| `js/ia.js` | Les appels aux IA : Claude (SDK officiel), Whisper chez Groq ou OpenAI, micro, dictée du navigateur |
| `js/vendor/anthropic.mjs` | Le SDK officiel d'Anthropic (`@anthropic-ai/sdk` 1.10.0) empaqueté pour le navigateur |
| `sw.js` | Service worker : met l'appli en cache |
| `manifest.webmanifest` | Nom, couleurs et icônes pour l'écran d'accueil |
| `icons/` | Les icônes, générées par `node outils/icones.js` |

## Après une modification

Change la valeur de `VERSION` en haut de `sw.js` (par exemple `perfectype-v2`).
Sans ça, les téléphones qui ont déjà l'appli continuent d'afficher l'ancienne version.

## Tester sur l'ordinateur

Le micro et le mode hors ligne ne marchent pas en ouvrant `index.html` directement (adresse en `file://`).
Lance un petit serveur dans le dossier : `npx serve`, puis ouvre l'adresse affichée.
