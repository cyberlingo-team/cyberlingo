# CyberLingo — règles du projet

Ce fichier s'adresse à **tout agent IA** (Claude Code, Codex, Cursor, Gemini…) qui travaille
sur ce dépôt, et aux humains qui le pilotent. Il est lu avant toute modification. Ce qui est
écrit ici l'emporte sur les habitudes par défaut de l'agent : si une habitude contredit une
règle de ce fichier, c'est la règle qui gagne.

## Le contexte

Projet noté du cours *Développement d'applications web et mobiles* (N7, 2A FISA,
J.-C. Buisson). Support du cours : https://wiki.jcbuisson.dev/cours/applications_internet_2APP/cours

- Sujet libre, **à condition d'utiliser les technologies vues en cours** (liste ci-dessous).
- L'usage de l'IA est autorisé sans restriction par l'enseignant. Les commits co-signés par
  un agent sont acceptés tels quels.
- **Le livrable est une vidéo** où l'équipe présente le site et ses fonctionnalités. Chaque
  écran doit donc être montrable : jamais de page vide, jamais de « Lorem ipsum », jamais de
  données de test visibles (« test », « aaa », « Projet 1 »).
- Le README doit contenir une **procédure d'installation en mode développement qui
  fonctionne** sur une machine neuve. Toute modification qui change l'installation (nouvelle
  dépendance système, nouvelle variable d'environnement, nouvelle commande) met le README à
  jour **dans le même commit**.

## Le produit

CyberLingo, « le Duolingo de la cybersécurité ». Chaque jour, une **mission commune à tout le
monde** (mots de passe, phishing, réseaux, chiffrement, ingénierie sociale…). Pas de comptes
utilisateurs obligatoires : la progression de chaque joueur (série de jours, points) vit dans
son navigateur.

## La pile technique imposée

Non négociable. Ne pas la remplacer, ne pas la contourner.

| Rôle | Technologie | Page du cours |
|---|---|---|
| Front-end | **Vue 3** (Composition API, `<script setup>`), créé avec **Vite** | `/minimal/vuejs`, `/minimal/vite` |
| Navigation | **vue-router** | `/minimal/vuejs` |
| Back-end | **Express 5** sur Node.js, API **REST** en JSON | `/minimal/express`, `/minimal/rest` |
| Base de données | **PostgreSQL** via **Prisma 7** | `/minimal/prisma` |
| Langage | **JavaScript** en modules ES (`"type": "module"`), pas de TypeScript dans notre code | `/minimal/javascript` |

Prisma s'utilise **dans sa version 7, comme sur la page du cours** : générateur
`prisma-client`, client généré dans `generated/prisma/`, adaptateur `@prisma/adapter-pg`, un
module `prisma.js` qui exporte le client. Les tutoriels et beaucoup d'exemples en ligne
utilisent encore la syntaxe de Prisma 5 et 6 (`import { PrismaClient } from '@prisma/client'`,
`url` dans `schema.prisma`) : elle **ne fonctionne pas** ici. Épingler toutes les dépendances
Prisma sur la même version majeure (`prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`).

## Autorisé en complément

Ces outils s'ajoutent à la pile ; aucun ne la remplace.

- **Vus en cours** : Tailwind CSS, SVG, Socket.IO et ExpressX (temps réel), VueUse,
  localStorage et sessionStorage, bcryptjs et JWT (si un jour des comptes sont ajoutés).
- **Pour le visuel et le mouvement** : animations CSS, `<Transition>` de Vue, GSAP, motion-v,
  Lenis, three.js ou TresJS, Lottie, polices Google Fonts ou auto-hébergées, images et vidéos
  générées.

## Interdit

- **React, Next.js, Nuxt, Svelte, Angular**, ou tout autre framework qui prendrait la place de
  Vue ou d'Express.
- Les services qui remplacent le back-end : **Firebase, Supabase, Appwrite, PocketBase**, etc.
  Les données passent par notre API Express et notre base PostgreSQL.
- Un autre ORM ou query-builder que Prisma (Drizzle, Knex, Sequelize, TypeORM…).
- Faire écrire au navigateur directement dans la base : il passe toujours par l'API.
- Committer un secret : `.env` est ignoré par git ; on versionne un `.env.example` à jour.

## L'organisation du dépôt

```
frontend/     Vue 3 + Vite (port 5173). Le proxy Vite redirige /api vers le back-end.
backend/      Express + Prisma (port 4000 par défaut, variable PORT).
  prisma/       schema.prisma
  prisma.js     le client Prisma partagé
  seed.js       remplit la base avec des données de démonstration réalistes
```

La base de démonstration doit être **assez riche pour tourner la vidéo** : plusieurs semaines
de missions, du contenu en français correct, des chiffres crédibles. `node seed.js` doit
pouvoir être relancé sans erreur.

## La façon de travailler

**Une première version construite d'un bloc, puis des chantiers répartis.** L'agent qui
construit la première version laisse volontairement quelques chantiers **petits, bien
délimités et réellement utiles** (une mission de plus, un écran secondaire, un état vide,
une animation, une route d'API), pour que chaque membre de l'équipe ait des commits à son nom.

Chaque chantier est une **issue GitHub** :

- assignée à un membre et qui le mentionne (`@pseudo`) ;
- qui dit **quoi** faire, **où** (fichiers concernés) et **comment vérifier** que c'est fini ;
- réalisable en une séance par une personne qui débute en JavaScript, aidée de son agent IA.

Un agent qui travaille pour un membre :

1. lit les issues assignées à ce membre (`gh issue list --assignee @me`) ;
2. crée une branche par issue (`issue-12-ecran-resultats`) ;
3. ouvre une pull request vers `main` dont la description contient `Closes #12` ;
4. ne modifie rien en dehors du périmètre de l'issue sans le signaler dans la PR.

On ne pousse jamais directement sur `main` un travail qui casse le lancement du projet :
`npm run dev` doit fonctionner dans `frontend/` et dans `backend/` après chaque fusion.

## L'équipe

| Membre | GitHub |
|---|---|
| Alexis Briend | [@Alexry375](https://github.com/Alexry375) |
| Théophane Chollet | [@TheophaneChollet](https://github.com/TheophaneChollet) |
| Mathéo Depuydt | [@matheodepuydt](https://github.com/matheodepuydt) |
| Benjamin Sarrat | [@benjamin-sarrat-n7](https://github.com/benjamin-sarrat-n7) |

## Langue

Interface, textes, commentaires et messages de commit en **français**, avec les accents.
Les identifiants de code restent en anglais.
