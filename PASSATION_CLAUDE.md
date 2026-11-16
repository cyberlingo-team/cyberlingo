# Passation : CyberLingo version appli (branche `version-duo`)

État au 16 novembre 2026. L'interface **repart du code de la copie de Codex** (gabarits, CSS,
déroulé des écrans), passée aux couleurs, aux images et au contenu de CyberLingo. Les données
viennent toutes du serveur simulé, par `frontend/src/api/`. Plus aucune ressource, aucun texte ni
aucune police de Duolingo dans l'arbre de travail.

Une première version réécrivait les écrans de zéro ; Alexis l'a jugée moins agréable que la copie
(l'écran de question surtout), d'où la reprise. La copie d'origine reste consultable sur la
branche locale `copie-codex` (commit 74c044a).

**Historique** : le 16 novembre, `version-duo` a été reconstruite sur `main` sans les commits de
la copie (qui contenaient des ressources de Duolingo). L'ancien historique reste sur la branche
locale `version-duo-avant-reecriture`, et la copie sur `copie-codex` : ces deux-là ne doivent
jamais être poussées. Rien n'est poussé sans l'accord d'Alexis.

## Ce qui existe

- **Le chemin** (`/apprendre`) : six thèmes, 29 leçons tirées des missions, un coffre par thème,
  un bilan par thème ; la mission du jour en tête. Contenu dans
  `frontend/src/api/simulation/units.js` et `path.js`.
- **L'écran de leçon** (`/lecon/:id`, `/mission-du-jour`), sur le modèle de la copie : une
  question à la fois (consigne, personnage dans sa bulle, objet, réponses numérotées au clavier),
  « Passer » (compte comme une erreur, `answer: null` dans le contrat), correction en bandeau
  vert ou rouge en bas, puis « Corrigeons tes erreurs » : les questions ratées reviennent, sans
  coût en bouées. Le bilan défile écran par écran : résultat et Tux qui grandit, Léopold à
  démasquer, série et classement, quêtes remplies, « À retenir », invitation à créer un profil.
  Fenêtres « Tu veux vraiment quitter ? » et « Plus de bouées ».
- **La réserve** : sardines, bouées, glaçons ; boutique, quêtes du jour et défi du mois.
- **Les autres écrans** : accueil, questionnaire de bienvenue, classement, Mon Tux (stats,
  semaine, succès, carnet, stades), guide d'un thème, préférences, aide, compte, crédits, 404.
- La liste des adresses est dans `design/site/NOTE.md` ; les routes du serveur simulé, y compris
  les nouvelles, dans `frontend/src/api/CONTRAT.md`.

Choix validés par Alexis : palette bleu toque (#1b2a8f) et orange bec (#f57c03) ; pas d'écrans
Sons ni Échecs ; mission du jour en tête du chemin, la même pour tous ; habillage « banquise »
(sardines, bouées, glaçons). Police : Nunito.

## Organisation du code

| Dossier | Contenu |
|---|---|
| `frontend/src/styles/app.css` | La feuille de la copie (préfixe `cl-`), couleurs remplacées par nos variables de `base.css` |
| `frontend/src/styles/home.css` | L'accueil, repris de la copie |
| `frontend/src/components/app/` | Coque (barre latérale, compteurs, onglets mobiles), cartes de droite, carte de quête, icônes, panneau d'état |
| `frontend/src/components/account/` | Cadre des réglages, scène de connexion, champ et jauge de mot de passe |
| `frontend/src/components/path/` | Mission du jour en tête, chemin en zigzag avec ses bulles |
| `frontend/src/components/lesson/` | Question, bas d'écran Valider/Continuer, bilan |
| `frontend/src/components/artifacts/` | Les objets examinés (SMS, mail, page…), repris de la version BD |
| `frontend/src/api/parcours.js`, `reserve.js` | Les nouvelles fonctions d'API |
| `frontend/src/lib/inventory.js` | La réserve affichée partout, rechargée après chaque action |

## Vérifier

```bash
cd frontend && npm run build
node design/site/outils/capture.mjs http://100.71.58.119:3635/apprendre apprendre --bureau
node design/site/parcours/lecon.mjs http://100.71.58.119:3635/lecon/adresse-piegee lecon bureau
```

Pour capturer connecté, se connecter dans la page avant d'y aller :
`await page.evaluate(async () => (await import('/src/lib/session.js')).login('sacha_31', 'banquise-sardine-parapluie'))`.

## Le back-end (`backend/`)

Commencé le 16 novembre : Express 5, Prisma 7 (comme la page `/minimal/prisma` du cours) et
PostgreSQL. Installation dans le README.

- `prisma/schema.prisma` couvre déjà tout le contrat : joueurs (comptes et visiteurs sans
  compte), missions et épisodes, parties et réponses, leçons du chemin, coffres, quêtes,
  échecs de connexion. Les routes à venir n'ont pas à toucher au schéma.
- Faites : `GET /api/session`, `GET /api/auth/rules`, `POST /api/auth/signup|login|logout`
  (bcryptjs, JWT dans un cookie httpOnly, frein après 5 échecs, réponses du visiteur reprises
  à l'inscription), `GET /api/game`, `GET /api/cast`. Tests dans `test/` (`npm test`).
- Le contenu et les règles ne sont pas recopiés : `lib/content.js` importe les modules de
  `frontend/src/api/simulation/`, et `seed.js` y prend les épisodes et les joueurs simulés.
- `npm run dev:express` dans `frontend/` branche l'interface sur ce serveur.
- La logique de chaque route à écrire existe déjà dans `frontend/src/api/simulation/server.js` :
  il s'agit de la porter sur Prisma.

## Reste à faire

- Les autres routes du back-end, en suivant `CONTRAT.md` (issues de l'équipe), puis faire du
  mode express le mode par défaut.
- La relecture des faits du contenu, interrompue dans la version BD.
- Écarts restants avec la copie : sur téléphone, la barre des compteurs reste affichée sur Quêtes
  et Mon Tux ; pas de page `/succes` (« Afficher tout » déplie la liste dans Mon Tux) ; le défi du
  mois apparaît deux fois entre 700 et 1079 px de large.
- Les leçons du chemin reprennent les questions des missions.
