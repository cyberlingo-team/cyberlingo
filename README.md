# CyberLingo

Le Duolingo de la cybersécurité : chaque jour, une **mission commune à tout le monde**
pour apprendre les bons réflexes (mots de passe, phishing, réseaux, chiffrement…).

Projet du cours *Développement d'applications web* — N7, 2A FISA.

## Équipe

- [@Alexry375](https://github.com/Alexry375)
- [@TheophaneChollet](https://github.com/TheophaneChollet)
- [@matheodepuydt](https://github.com/matheodepuydt)
- [@benjamin-sarrat-n7](https://github.com/benjamin-sarrat-n7)

## Lancer le site

Il faut **Node.js 20.19 ou plus récent** (`node -v` pour vérifier) et git.

```bash
git clone https://github.com/cyberlingo-team/cyberlingo.git
cd cyberlingo/frontend
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

Le back-end n'existe pas encore : l'interface tourne contre un **serveur simulé**
(`frontend/src/api/simulation/`) qui garde ses données dans le navigateur. Les comptes créés et
les épisodes joués restent donc dans ce navigateur. Les routes que le vrai serveur Express devra
implémenter sont décrites dans [frontend/src/api/CONTRAT.md](frontend/src/api/CONTRAT.md).

**Comptes de démonstration**, tous avec le mot de passe `banquise-sardine-parapluie` :

| Pseudo | Situation |
|---|---|
| `sacha_31` | une série en cours, l'épisode du jour à faire |
| `malo.dlt` | une série perdue hier |
| `Capitaine_des_mots_de_passe_42` | l'épisode du jour déjà fait |

**États à montrer**, en ajoutant à l'adresse :

- `?simulation=lent` : les chargements ;
- `?simulation=panne` : le serveur qui ne répond pas ;
- `?simulation=normal` : retour à la normale ;
- `?simulation=reinitialiser` : efface les comptes créés et les parties jouées.

Pour voir le site depuis un téléphone du même réseau : `npm run dev -- --host`, puis ouvrir
l'adresse « Network » affichée.

La liste des écrans et leurs adresses est dans [design/site/NOTE.md](design/site/NOTE.md).

## Technologies

Celles du cours : Vue.js, Express, Prisma (PostgreSQL), Vite.
Les règles détaillées, y compris pour les agents IA, sont dans [AGENTS.md](AGENTS.md).

## Livrable

Une vidéo de présentation du site et de ses fonctionnalités.
