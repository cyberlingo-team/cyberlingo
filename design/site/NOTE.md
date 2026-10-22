# CyberLingo, version appli (branche `version-duo`) : note de livraison

## Le concept

Une appli d'apprentissage à la manière de Duolingo, avec l'univers de CyberLingo. Le joueur
avance sur un **chemin** de six thèmes (hameçonnage, mots de passe, téléphone, arnaques en ligne,
appareils, Wi-Fi) : des leçons dans l'ordre, un coffre de sardines, un bilan par thème. En tête
du chemin, la **mission du jour**, la même pour tout le monde, fait avancer la série et rapporte
le plus de points. Dans chaque question, Tux le prof et un membre de sa bande examinent un SMS,
un mail ou une page ; la correction s'écrit sur l'objet. Les points font prendre du muscle au
Tux du joueur, du poussin au brise-glace. L'habillage est celui de la banquise : des
**sardines** pour la boutique, des **bouées** qu'une erreur fait perdre, des **glaçons** qui
gèlent la série.

La branche `main` garde la version « BD du jour » ; cette note ne vaut que pour `version-duo`.

## Les écrans

| Adresse | Écran |
|---|---|
| `/` | L'accueil, pour qui n'a pas de profil (un joueur connecté va droit à `/apprendre`). |
| `/bienvenue` | Le petit questionnaire d'arrivée, puis la première leçon. |
| `/apprendre` | La mission du jour, puis le chemin. Toucher une étape ouvre sa bulle : commencer, rejouer, ouvrir le coffre, ou pourquoi elle est verrouillée. |
| `/apprendre/<thème>/guide` | Le guide d'un thème : ses réflexes et ses sources (ex. `/apprendre/hameconnage/guide`). |
| `/lecon/<id>` | Une leçon ou un bilan, en plein écran : une question à la fois, « Valider », la correction en bas, puis le bilan (ex. `/lecon/adresse-piegee`). Sans bouée, un écran propose la boutique ou la mission du jour. |
| `/mission-du-jour` | La mission du jour, même écran ; au bilan, Léopold se démasque et la place au classement s'affiche. |
| `/classement` | Le classement de la semaine ; `?periode=tout` depuis le lancement. |
| `/quetes` | Les trois quêtes du jour et le défi du mois. |
| `/boutique` | Bouées regonflées et glaçons, payés en sardines (profil nécessaire). |
| `/mon-tux` | Le Tux à son stade, les chiffres, la semaine en barres, les succès, le carnet des missions, l'échelle des stades. |
| `/preferences` | Bruitages et animations. |
| `/mon-compte` | Pseudo, mot de passe, suppression du compte (profil nécessaire). |
| `/aide` | Que faire après un clic piégé, et les règles du jeu. |
| `/connexion`, `/inscription` | Se connecter, créer un profil ; la progression d'invité suit. |
| `/credits` | Images, polices, sources. |
| toute autre adresse | La page introuvable. |

Les états difficiles s'obtiennent depuis l'adresse : `?simulation=lent`, `?simulation=panne`,
`?simulation=normal`, `?simulation=reinitialiser`.

Comptes de démonstration, mot de passe `banquise-sardine-parapluie` : `sacha_31` (série en
cours, chemin au thème 3), `malo.dlt` (série perdue hier, un coffre à ouvrir),
`Capitaine_des_mots_de_passe_42` (dernier stade, chemin fini, mission du jour faite).

Les captures se font avec `design/site/outils/capture.mjs` ; `design/site/parcours/lecon.mjs`
joue une leçon ou la mission du jour jusqu'au bilan. Les captures vont dans
`design/site/rendus/`, ignoré par git.

## Ce qui reste imparfait

- **Pas de serveur.** Tout tourne contre le serveur simulé, dans le `localStorage` du
  navigateur ; les nouvelles routes (chemin, leçons, réserve, quêtes, boutique) sont décrites
  dans `frontend/src/api/CONTRAT.md` pour le futur back-end.
- **Les leçons reprennent les missions** : une leçon du chemin et une mission du jour peuvent
  poser les mêmes questions.
- **Les objets examinés** (SMS, mails, pages) gardent le trait noir de la version BD.
