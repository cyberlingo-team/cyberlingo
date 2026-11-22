# CyberLingo

Le Duolingo de la cybersécurité : un **chemin de leçons** à suivre à son rythme (hameçonnage,
mots de passe, arnaques au téléphone et en ligne, appareils, Wi-Fi) et, chaque jour, une
**mission commune à tout le monde**. Tux le prof et sa bande y déjouent les arnaques de
Léopold, un léopard de mer escroc ; les points font prendre du muscle au Tux du joueur.

Projet du cours *Développement d'applications web* — N7, 2A FISA.

**En ligne : https://cyberlingo.alexis-briend375.workers.dev**, branché sur le vrai back-end
(comptes de démonstration plus bas).

## Équipe

- [@Alexry375](https://github.com/Alexry375)
- [@TheophaneChollet](https://github.com/TheophaneChollet)
- [@matheodepuydt](https://github.com/matheodepuydt)
- [@benjamin-sarrat-n7](https://github.com/benjamin-sarrat-n7)

## Lancer le site

Il faut **Node.js 22.18 ou plus récent** (`node -v` pour vérifier) et git.

```bash
git clone https://github.com/cyberlingo-team/cyberlingo.git
cd cyberlingo/frontend
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

Ainsi lancée, l'interface tourne contre un **serveur simulé** (`frontend/src/api/simulation/`)
qui garde ses données dans le navigateur : pas besoin de base de données pour voir le site. Les
comptes créés, les leçons et les missions jouées restent dans ce navigateur. Toutes les routes
de l'API sont décrites dans [frontend/src/api/CONTRAT.md](frontend/src/api/CONTRAT.md).

## Lancer le back-end

Le vrai serveur est dans `backend/` : Express 5, Prisma 7 et PostgreSQL. Il implémente toutes les
routes du contrat : comptes et session, épisodes et réponses, chemin de leçons, coffres, réserve,
boutique, quêtes, classement et profil. Un fichier par groupe de routes dans `backend/routes/`.

**1. Une base PostgreSQL.** Au choix :

- PostgreSQL installé sur la machine (https://www.postgresql.org/download/). Créer un
  utilisateur et une base, par exemple sous Linux ou macOS :

  ```bash
  sudo -u postgres psql -c "CREATE USER cyberlingo WITH PASSWORD 'choisis-un-mot-de-passe' CREATEDB;"
  sudo -u postgres createdb -O cyberlingo cyberlingo
  ```

  L'adresse de la base est alors `postgresql://cyberlingo:choisis-un-mot-de-passe@localhost:5432/cyberlingo`.

- Ou, sans rien installer, la base locale de Prisma : `cd backend && npx prisma dev`, dans un
  terminal qu'on laisse ouvert. Elle affiche son adresse « TCP » (`postgres://postgres:postgres@localhost:51214/…`).

**2. Le serveur.**

```bash
cd backend
cp .env.example .env     # puis y mettre l'adresse de la base et un JWT_SECRET (la commande est dans le fichier)
npm install              # installe aussi le client Prisma (prisma generate)
npx prisma db push       # crée les tables (à relancer après chaque modification de prisma/schema.prisma)
npm run seed             # remplit la base : épisodes, 230 joueurs, comptes de démonstration
npm run dev              # l'API écoute sur http://localhost:4000/api
```

`npm test` lance les tests de l'API (il faut que la base soit remplie). `npx prisma studio`
ouvre une interface pour parcourir la base.

**3. L'interface branchée sur le back-end**, dans un autre terminal :

```bash
cd frontend
npm run dev:express
```

Le proxy de Vite envoie les appels `/api` au serveur du port 4000.

**Comptes de démonstration**, dans le serveur simulé comme dans la base remplie par `npm run seed`, tous
avec le mot de passe `banquise-sardine-parapluie` :

| Pseudo | Situation |
|---|---|
| `sacha_31` | une série en cours, la mission du jour à faire, le chemin au thème 3 |
| `malo.dlt` | une série perdue hier, un coffre à ouvrir au thème 2 |
| `Capitaine_des_mots_de_passe_42` | la mission du jour déjà faite, tout le chemin terminé |

**États à montrer** avec le serveur simulé, en ajoutant à l'adresse :

- `?simulation=lent` : les chargements ;
- `?simulation=panne` : le serveur qui ne répond pas ;
- `?simulation=normal` : retour à la normale ;
- `?simulation=reinitialiser` : efface les comptes créés et les parties jouées.

Pour voir le site depuis un téléphone du même réseau : `npm run dev -- --host`, puis ouvrir
l'adresse « Network » affichée.

## Les écrans

| Adresse | Écran |
|---|---|
| `/` | L'accueil, pour qui n'a pas de profil (un joueur connecté va droit à `/apprendre`). |
| `/bienvenue` | Le petit questionnaire d'arrivée, puis la première leçon. |
| `/apprendre` | La mission du jour, puis le chemin : six thèmes, leurs leçons, un coffre et un bilan par thème. |
| `/apprendre/<thème>/guide` | Le guide d'un thème : ses réflexes et ses sources (ex. `/apprendre/hameconnage/guide`). |
| `/lecon/<id>` | Une leçon, une question à la fois ; les questions ratées reviennent à la fin, puis le bilan (ex. `/lecon/adresse-piegee`). |
| `/mission-du-jour` | La mission du jour ; au bilan, Léopold se démasque et la place au classement s'affiche. |
| `/classement` | Le classement de la semaine ; `?periode=tout` depuis le lancement. |
| `/quetes` | Les trois quêtes du jour et le défi du mois. |
| `/boutique` | Bouées regonflées et glaçons, payés en sardines (profil nécessaire). |
| `/mon-tux` | Le Tux du joueur à son stade, ses chiffres, sa semaine, ses succès, le carnet des missions. |
| `/succes` | Tous les succès et leurs paliers. |
| `/preferences` | Bruitages et animations. |
| `/mon-compte` | Pseudo, mot de passe, suppression du compte (profil nécessaire). |
| `/aide` | Que faire après un clic piégé, et les règles du jeu. |
| `/connexion`, `/inscription` | Se connecter, créer un profil ; la progression jouée sans compte suit. |
| `/credits` | Images, polices, sources. |
| toute autre adresse | La page introuvable. |

## Technologies

Celles du cours : Vue.js, Express, Prisma (PostgreSQL), Vite.
Les règles détaillées, y compris pour les agents IA, sont dans [AGENTS.md](AGENTS.md).

## Livrable

Une vidéo de présentation du site et de ses fonctionnalités.
