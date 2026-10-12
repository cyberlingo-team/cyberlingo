<contexte>
CyberLingo est le projet noté de quatre apprentis ingénieurs de l'N7 (2e année, cours de
développement d'applications web et mobiles). En fin de semestre, l'équipe filme le site et
présente ses fonctionnalités dans une vidéo, devant l'enseignant et toute la promotion. Le
premier écran sera la première image de cette vidéo.

Mais ce n'est pas un décor de vidéo : c'est un site dont on se sert. Ceux qui y viennent sont
des étudiants et des gens ordinaires, pas des experts en sécurité. Ils arrivent depuis leur
téléphone dans le tram ou depuis leur ordinateur entre deux cours, pour trois minutes, et
repartent.

Tu construis toute l'interface, maintenant. Juste après toi, les quatre membres de l'équipe
brancheront le vrai serveur à la place de tes données de démonstration : Express, PostgreSQL
via Prisma, comptes avec mots de passe hachés et session dans un cookie. Ton interface est donc
aussi le cahier des charges de leur travail.
</contexte>

<challenge>
Construis l'application web CyberLingo, « le Duolingo de la cybersécurité » : chaque jour, une
mission commune à tout le monde (mots de passe, hameçonnage, réseaux, chiffrement, ingénierie
sociale…), un compte par joueur, sa série de jours, ses points et sa place au classement.

La matière imposée :

- `design/logo/tux-prof.svg` : le logo, Tux en professeur, et `design/logo/tux-prof-tete.svg`,
  son recadrage sur la tête. C'est le seul logo.
- `design/site/matiere/manchots-salisbury.jpg` et `design/site/matiere/manchots-parade.jpg` :
  deux photographies de manchots royaux.

Ce qu'on doit ressentir : espiègle, attachant, vigilant, et l'envie de revenir demain.
</challenge>

<liberte-creative>
Donne toujours la priorité à la créativité. Prends des décisions audacieuses, inattendues, et
développe un concept original plutôt que de suivre les conventions familières des applications
d'apprentissage et des sites de cybersécurité.

Tu as une liberté créative complète sur le concept, les fonctionnalités au-delà de la mission
du jour, les écrans et leur enchaînement, les textes, la mise en page, la typographie, les
couleurs, les illustrations, les transitions, les interactions et le son. Utilise le logo et les
photographies de la manière qui crée l'expérience la plus forte : recadre-les, détoure-les,
superpose-les, fragmente-les, mets-les en mouvement, fais-en un élément de l'interaction. Une
photo plein écran avec un titre centré par-dessus, suivie de cartes blanches arrondies, n'est
pas une interprétation de ces images : ne livre pas ça en prétendant que c'est fini. Traite-les
comme de la matière brute pour un univers visuel cohérent, tenu du premier écran au dernier.

Ce que tout le monde a déjà vu et dont on ne veut pas : les cadenas, les boucliers, les
capuches de pirate, la pluie de caractères verts, le terminal vert sur noir en guise d'identité,
le binaire en fond d'écran, les néons et les dégradés violet-bleu. Ni une copie de Duolingo :
pas son vert, pas sa chouette, pas ses boutons en relief, pas son chemin de leçons. Ni un
tableau de bord de logiciel en ligne, avec barre latérale, cartes de statistiques et graphique.
Évite l'esthétique générique des bibliothèques de composants.
</liberte-creative>

<le-desequilibre>
La matière est inégale : un personnage dessiné et deux photographies d'animaux réels ; deux
images pour une application entière, où l'on passera l'essentiel du temps à répondre à des
questions. Ne comble pas l'écart avec du remplissage. Trouve la forme qui fait de ce
déséquilibre une intention.
</le-desequilibre>

<les-parcours>
Quel que soit le concept, trois choses doivent réussir :

1. Quelqu'un qui n'a jamais entendu parler de CyberLingo arrive sur le site et, en moins d'une
   minute, a compris de quoi il s'agit et répondu à sa première question.
2. Un habitué ouvre le site sur son téléphone, voit tout de suite où il en est, fait la mission
   du jour en trois minutes, et repart en comprenant *pourquoi* la bonne réponse était la bonne,
   pas seulement s'il avait juste.
3. Il voit où il se situe par rapport aux autres, et repart avec une raison précise de revenir
   demain.

L'échec à éviter porte un nom : une application qu'il faut apprendre avant qu'elle serve. Il en
a un second : un site dont on admire l'accueil, puis qui devient quelconque dès qu'on commence
à s'en servir.

Il n'y a pas de tension entre ce bloc et la liberté créative, et ce serait une erreur de la
traiter comme telle. L'audace porte sur la forme ; l'évidence porte sur l'usage.
</les-parcours>

<fini>
Ce qui sépare une maquette d'une application :

- **Des données de démonstration assez riches pour juger.** Plusieurs semaines de missions
  passées, chacune avec de vraies questions et leurs explications ; un classement d'une
  quarantaine de joueurs aux pseudos crédibles, dont les séries et les points varient vraiment ;
  un joueur de démonstration qui a un passé (une série en cours, un record, des missions
  ratées). Les données se calent sur la date du jour : la vidéo sera tournée un autre jour que
  celui où tu écris. Jamais « Mission 1, 2, 3 », jamais « Lorem ipsum », jamais « test ».
- **Les cas qu'on ne dessine jamais.** La mauvaise réponse ; la mission déjà faite aujourd'hui ;
  la série perdue ; le tout premier jour, sans aucun historique ; le pseudo de trente
  caractères ; le chargement ; le serveur qui ne répond pas ; le mot de passe refusé ; le pseudo
  déjà pris ; l'adresse qui n'existe pas ; quelqu'un qui a désactivé les animations dans son
  système.
- **Le parti pris tenu jusqu'au dernier écran.** Le formulaire d'inscription, la page d'erreur
  et la page des crédits appartiennent au même monde que l'accueil.
</fini>

<contraintes>
- **Lis `AGENTS.md`** : la pile imposée et ce qui est interdit y sont décrits, et ils
  s'appliquent. Vue 3 en `<script setup>`, Vite, vue-router, JavaScript sans TypeScript. Tu peux
  ajouter les bibliothèques de la liste « Autorisé en complément », en version exacte
  (`npm install --save-exact`).
- **Toutes les données passent par `frontend/src/api/`** : une fonction asynchrone par future
  route REST (chemins en `/api/…`), qui renvoie aujourd'hui des données de démonstration avec
  une petite latence simulée. Aucun composant ne contient de données en dur ni n'importe les
  données de démonstration directement : le jour où le serveur arrive, l'équipe remplace le
  corps de ces fonctions par un `fetch`, sans toucher aux écrans. Décris chaque route dans
  `frontend/src/api/CONTRAT.md` (méthode, chemin, ce qui est envoyé, ce qui revient, les
  erreurs possibles) : c'est ce document que l'équipe implémentera en Express. Sois précis.
- **Les comptes fonctionnent de bout en bout contre ces données simulées** : inscription,
  connexion, déconnexion, avec pseudo et mot de passe. La session sera un cookie `httpOnly` que
  le navigateur ne pourra pas lire : ton interface ne manipule jamais de jeton, elle demande
  au serveur qui est connecté.
- **Ce site enseigne la sécurité : son contenu doit être exact.** Chaque question, chaque
  explication, chaque conseil est conforme aux recommandations établies (ANSSI, CNIL,
  Cybermalveillance.gouv.fr). N'invente aucun chiffre, aucune statistique, aucune citation,
  aucun incident présenté comme réel, et ne mets en scène aucune personne réelle. Un faux
  courriel piégé dans un exercice est bienvenu ; un faux chiffre présenté comme vrai ne l'est
  pas.
- **Aucune image ni aucun son récupérés en ligne** en dehors de la matière fournie. Ce que tu
  crées toi-même (SVG, CSS, Web Audio) est permis. Les polices de Google Fonts sont permises.
- **Crédits** : une page de crédits, atteignable depuis toute l'application, reprend
  `design/site/matiere/CREDITS.md`.
- Textes en français correct, avec les accents. Le nom s'écrit exactement « CyberLingo ».
- **Périmètre** : tu écris dans `frontend/` et dans `design/site/` (`rendus/`, `parcours/`,
  `NOTE.md`), nulle part ailleurs. Ne crée pas `backend/`. Ne modifie ni `AGENTS.md`, ni
  `README.md` (on le mettra à jour après toi), ni `design/logo/`, ni `design/site/outils/`, ni
  `design/site/matiere/`.
- **Ne laisse rien d'inachevé exprès.** Les chantiers que `AGENTS.md` prévoit pour l'équipe,
  ce sera le serveur ; l'interface, elle, doit être aussi finie que tu le peux.
- **Git** : tu es sur la branche `premiere-version`. Commite à chaque étape qui fonctionne,
  messages en français. Ne pousse jamais, ne change pas de branche, ne réécris pas l'historique,
  ne crée pas d'issue.
- **Temps** : 60 minutes, puis coupure nette. `design/site/outils/temps.sh` te dit combien il
  reste ; consulte-le souvent. À tout instant, ton dernier commit doit être une application qui
  démarre (`npm run build` passe dans `frontend/`). Quand il reste moins de dix minutes,
  n'ajoute plus rien : finis, vérifie, commite, écris la note.
</contraintes>

<harnais>
Déjà installé et testé, à ne pas modifier :

- `frontend/` : Vue 3.5.43, vue-router 5.3.1, Vite 8.3.1, une page vide et un routeur à une
  route. `npm run dev`, `npm run build`. Le proxy `/api` vers le port 4000 est prêt pour le
  futur serveur ; aucun serveur n'y écoute pour l'instant, ne t'en sers pas.
- **Le port est à toi de choisir** : prends un port libre entre 5200 et 5299 (vérifie avec
  `ss -ltn`), puis lance, en arrière-plan, depuis `frontend/` :
  `npm run dev -- --port <port> --strictPort`. D'autres applications tournent sur cette
  machine : n'arrête jamais un processus que tu n'as pas lancé.
- `design/site/outils/capture.mjs`, à lancer depuis la racine du dépôt :
  ```
  node design/site/outils/capture.mjs <url> <nom> [--bureau|--mobile] [--pleine-page] [--attente ms]
  ```
  Écrit `design/site/rendus/<nom>-bureau.png` (1440×900) et `<nom>-mobile.png` (390×844, en
  densité 2), puis affiche les erreurs de la console et les ressources introuvables.
- Pour les états qui demandent d'agir (répondre faux, finir une mission, s'inscrire avec un
  pseudo déjà pris), écris tes propres scripts dans `design/site/parcours/`, sur le modèle de
  `design/site/outils/exemple-parcours.mjs` : Playwright, piloté par le Chrome de la machine.
- `design/site/outils/temps.sh` : le temps écoulé et le temps restant.
</harnais>

<livraison>
Construis l'application complète dans `frontend/`. Elle doit fonctionner à merveille sur
téléphone comme sur ordinateur.

Regarde ce que tu produis. Fais réellement les trois parcours, en mobile et en bureau, capture
chaque écran et chaque état, et ouvre les images. Itère jusqu'à ce que ce soit réellement bien,
pas jusqu'à ce que ça marche. Mets côte à côte ton premier écran et ton dernier : s'ils
semblent venir de deux applications différentes, ce n'est pas fini.

N'explique pas le concept avant de le construire. Prends les décisions créatives toi-même et
livre le résultat le plus original et le plus abouti dont tu es capable.

À la fin, et seulement à la fin, écris `design/site/NOTE.md`, court : le concept en trois
lignes, comment lancer, la liste des écrans avec leur adresse, et ce que tu aurais fait avec
plus de temps.
</livraison>
