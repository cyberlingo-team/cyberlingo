# Onboarding : la version appli de CyberLingo

Ce fichier donne tout le contexte à l'agent qui pilote ce chantier. Il lit aussi `AGENTS.md`,
dont les règles l'emportent sur tout le reste.

## Passation actuelle

Lire [PASSATION_CLAUDE.md](PASSATION_CLAUDE.md) : l'interface reprend le code de la copie de
référence, passé à l'identité et au contenu de CyberLingo. La question au micro a été retirée à la demande
d'Alexis ; ne pas la réintroduire.

## Le projet

CyberLingo, « le Duolingo de la cybersécurité », est le projet noté de quatre apprentis de l'N7
(2A FISA) pour le cours *Développement d'applications web* de J.-C. Buisson. Chaque jour, un
épisode commun à tout le monde apprend à repérer une arnaque en ligne.

- **Le livrable est une vidéo** où l'équipe présente le site. Chaque écran doit être montrable.
- **L'IA est autorisée** sans restriction par l'enseignant.
- **La pile est imposée** (`AGENTS.md`) : Vue 3 et vue-router avec Vite, Express 5, Prisma 7 et
  PostgreSQL, JavaScript en modules ES. Interdits : React, Next, Nuxt, Svelte, Angular, Firebase,
  Supabase, tout autre ORM. Dépendances ajoutées en version exacte.
- **Langue** : interface, textes, commentaires et commits en français, avec les accents.

## L'état du dépôt

- **`main`** (depuis le 16 novembre) : l'appli d'apprentissage à la manière de Duolingo, un
  chemin de leçons par thème, la mission du jour en tête, sardines, bouées, glaçons, quêtes,
  boutique. Tux le prof et sa bande déjouent les arnaques de Léopold, un léopard de mer escroc
  qui change de déguisement ; le Tux du joueur prend du muscle avec ses points (huit stades).
  L'équipe part de `main` et y ouvre ses pull requests (voir `AGENTS.md`).
- La version précédente, « la BD du jour », reste dans l'historique (commit `ba9ccaa`).
- **Le back-end commence** (`backend/`, voir le README) : comptes et session, règles du jeu et
  personnages. Les autres routes viendront des issues de l'équipe. En attendant, l'interface
  tourne par défaut contre un serveur simulé (`frontend/src/api/simulation/`) qui garde ses
  données dans le navigateur ; `npm run dev:express` la branche sur le vrai serveur. Toutes les
  données passent par `frontend/src/api/`, et les routes sont décrites dans
  `frontend/src/api/CONTRAT.md`. Ne jamais mettre de données en dur dans un écran.
- **Comptes de démonstration**, mot de passe `banquise-sardine-parapluie` : `sacha_31`,
  `malo.dlt`, `Capitaine_des_mots_de_passe_42`.
- `design/site/NOTE.md` liste tous les écrans et leurs adresses.

## La matière visuelle

- `design/logo/tux-prof.svg` et `tux-prof-tete.svg` : le logo, Tux en professeur.
- `design/site/matiere/progression/` : les huit stades du Tux du joueur (`0-bebe.png` à `7.png`).
- `design/site/matiere/famille/` : douze Tux libres de Wikimedia Commons, « la bande ».
- `frontend/src/assets/` : les mêmes en WebP, plus les images déjà générées (Léopold et ses
  déguisements dans `villain/`, Tux le prof en situation dans `tux/scenes/`).
- `design/site/matiere/CREDITS.md` et la page `/credits` : chaque image ajoutée y est créditée.

Pour créer une illustration qui manque :

    design/site/outils/generer-image.sh <sortie.png> "<description>" [référence…]

Le script appelle Codex dans le style des Tux de la progression (ou des références jointes). Il
faut compter une à trois minutes par image, et il est plafonné à 40 images par session. Ouvrir
chaque image avant de s'en servir.

## Les outils de vérification

- `node design/site/outils/capture.mjs <url> <nom> [--bureau|--mobile] [--pleine-page]` : capture
  dans `design/site/rendus/` (1440×900 et 390×844), et affiche les erreurs de la console.
- `design/site/outils/navigateur.mjs` et `exemple-parcours.mjs` : pour scripter un parcours.

Chrome tourne sans écran sur le VPS : le rendu est identique à celui d'un écran.

## Faire tourner le site

Le service connex `cyberlingo` sert `frontend/` en continu sur http://100.71.58.119:3635/, et
Alexis le regarde depuis son laptop. Il sert le dossier tel qu'il est sur le disque : changer de
branche change ce qu'il voit. Ne pas l'arrêter, ni aucun autre service connex.

Pour tes propres essais, lance un serveur de dev à toi sur un port libre entre 5200 et 5299,
sur 127.0.0.1 (jamais 0.0.0.0, le VPS est sur Internet) :

    cd frontend && npx vite --host 127.0.0.1 --port <port> --strictPort

N'arrête jamais un processus que tu n'as pas lancé.

## La mission

Étape 1 (copie de référence, faite par Codex) et étape 2 (reprise de son code avec l'identité
et le contenu de CyberLingo) sont faites. La suite est dans PASSATION_CLAUDE.md.

## Git

- Travaille sur une branche partie de `main`. Commite à chaque étape qui fonctionne ; chaque
  commit se construit (`cd frontend && npm run build`).
- Ne pousse pas, ne fusionne pas dans `main`, ne crée pas d'issue sans l'accord d'Alexis.
- Ne jamais pousser `copie-codex` ni `version-duo-avant-reecriture` (branches locales qui
  contiennent des ressources de Duolingo).

## Ce qui veut dire « fini »

- La page se construit, sans erreur dans la console, en bureau (1440) et en mobile (390).
- Toutes les données passent par `frontend/src/api/`, et `CONTRAT.md` décrit chaque route.
- Chaque image ajoutée est créditée (`design/site/matiere/CREDITS.md` et la page `/credits`).
- Aucune ressource, aucun texte ni aucune police de Duolingo dans le dépôt.
