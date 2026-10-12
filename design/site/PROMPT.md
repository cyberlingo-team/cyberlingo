<contexte>
CyberLingo est le projet noté de quatre apprentis ingénieurs de l'N7. En fin de semestre,
l'équipe filme le site et présente ses fonctionnalités dans une vidéo, devant l'enseignant et
toute la promotion.

Mais ce n'est pas un décor de vidéo : c'est un site dont on se sert. Ceux qui y viennent ne
sont pas des experts en sécurité. Ils arrivent depuis leur téléphone ou leur ordinateur, pour
quelques minutes, et repartent.

Tu construis toute l'interface. Juste après toi, l'équipe branchera le vrai serveur à la place
de tes données de démonstration : ton interface est aussi le cahier des charges de leur travail.
</contexte>

<challenge>
Construis l'application web CyberLingo, « le Duolingo de la cybersécurité » : chaque jour, une
mission commune à tout le monde.

La matière imposée :

- `design/logo/tux-prof.svg` : le logo, et `design/logo/tux-prof-tete.svg`, son recadrage sur
  la tête.
- `design/site/matiere/manchots-salisbury.jpg` et `design/site/matiere/manchots-parade.jpg`.

Ce qu'on doit ressentir : espiègle, attachant, vigilant, et l'envie de revenir demain.
</challenge>

<liberte-creative>
Donne toujours la priorité à la créativité. Prends des décisions audacieuses, inattendues, et
développe un concept original plutôt que de suivre les conventions familières des applications
d'apprentissage et des sites de cybersécurité.

Tu as une liberté créative complète sur le concept, les fonctionnalités, les écrans et leur
enchaînement, les textes, la mise en page, la typographie, les couleurs, les illustrations, les
transitions, les interactions et le son. Utilise le logo et les photographies de la manière qui
crée l'expérience la plus forte : recadre-les, détoure-les, superpose-les, fragmente-les,
mets-les en mouvement, fais-en un élément de l'interaction. Une photo plein écran avec un titre
centré par-dessus, suivie de cartes blanches arrondies, n'est pas une interprétation de ces
images : ne livre pas ça en prétendant que c'est fini. Traite-les comme de la matière brute pour
un univers visuel cohérent, tenu du premier écran au dernier.

Ce que tout le monde a déjà vu : les cadenas, les boucliers, les capuches de pirate, la pluie de
caractères verts, le terminal vert sur noir, le binaire en fond d'écran, les néons et les
dégradés violet-bleu. Une copie de Duolingo : son vert, sa chouette, ses boutons en relief, son
chemin de leçons. Un tableau de bord avec barre latérale, cartes de statistiques et graphique.
L'esthétique générique des bibliothèques de composants. Rien de tout ça.
</liberte-creative>

<les-parcours>
Quel que soit le concept, trois choses doivent réussir :

1. Quelqu'un qui n'a jamais entendu parler de CyberLingo arrive et, en moins d'une minute, a
   compris de quoi il s'agit et répondu à sa première question.
2. Un habitué ouvre le site sur son téléphone, voit tout de suite où il en est, fait la mission
   du jour en trois minutes, et repart en ayant compris quelque chose, pas seulement avec un
   score.
3. Il voit où il se situe par rapport aux autres, et repart avec une raison précise de revenir
   demain.

L'échec à éviter porte un nom : une application qu'il faut apprendre avant qu'elle serve. Il en
a un second : un site dont on admire l'accueil, puis qui devient quelconque dès qu'on s'en sert.

Il n'y a pas de tension entre ce bloc et la liberté créative, et ce serait une erreur de la
traiter comme telle. L'audace porte sur la forme ; l'évidence porte sur l'usage.
</les-parcours>

<fini>
Ce qui sépare une maquette d'une application :

- **Des données de démonstration assez riches pour juger** : des semaines d'historique, un
  classement assez peuplé pour avoir un milieu, un joueur de démonstration qui a un passé. Elles
  se calent sur la date du jour, car la vidéo sera tournée un autre jour. Jamais « Mission 1,
  2, 3 », jamais « Lorem ipsum », jamais « test ».
- **Les cas qu'on ne dessine jamais** : la mauvaise réponse, la mission déjà faite, la série
  perdue, le tout premier jour, le pseudo de trente caractères, le chargement, le serveur qui
  ne répond pas, les erreurs de formulaire, l'adresse qui n'existe pas, les animations
  désactivées par le système.
- **Le parti pris tenu jusqu'au dernier écran** : le formulaire d'inscription et la page
  d'erreur appartiennent au même monde que l'accueil.
</fini>

<contraintes>
- Les règles de `AGENTS.md` s'appliquent (pile imposée, interdits, langue). Bibliothèques
  ajoutées en version exacte.
- **Toutes les données passent par `frontend/src/api/`** : une fonction asynchrone par future
  route REST (`/api/…`), qui renvoie pour l'instant des données de démonstration avec une petite
  latence. Aucun écran ne contient de données en dur : l'équipe remplacera le corps de ces
  fonctions par un `fetch` sans toucher aux écrans. Décris chaque route dans
  `frontend/src/api/CONTRAT.md` (méthode, chemin, envoi, réponse, erreurs) : c'est ce que
  l'équipe implémentera en Express.
- **Les comptes marchent de bout en bout** contre ces données simulées : inscription, connexion,
  déconnexion, pseudo et mot de passe. La session sera un cookie `httpOnly` : l'interface ne
  manipule jamais de jeton, elle demande au serveur qui est connecté.
- **Le contenu est exact** : conforme aux recommandations de l'ANSSI, de la CNIL et de
  Cybermalveillance.gouv.fr. Aucun chiffre, aucune citation, aucun incident inventé présenté
  comme réel ; aucune personne réelle.
- **Aucune image ni aucun son récupérés en ligne** hors de la matière fournie ; ce que tu crées
  toi-même est permis. Une page de crédits, atteignable partout, reprend
  `design/site/matiere/CREDITS.md`.
- **Ne laisse rien d'inachevé exprès** : les chantiers de l'équipe, ce sera le serveur.
- **Périmètre** : tu écris dans `frontend/` et `design/site/` (`rendus/`, `parcours/`,
  `NOTE.md`), nulle part ailleurs.
- **Git** : branche `premiere-version`. Commite à chaque étape qui fonctionne. Ne pousse pas, ne
  change pas de branche, ne crée pas d'issue.
- **Temps** : 60 minutes, puis coupure nette. Ton dernier commit doit toujours être une
  application qui se construit (`npm run build`). Sous les dix minutes restantes, n'ajoute plus
  rien : finis, vérifie, commite.
</contraintes>

<harnais>
Déjà installé et testé, à ne pas modifier :

- `frontend/` : Vue, vue-router et Vite, une page vide. Choisis un port libre entre 5200 et 5299
  (`ss -ltn`) et lance en arrière-plan `npm run dev -- --port <port> --strictPort`. N'arrête
  jamais un processus que tu n'as pas lancé.
- `node design/site/outils/capture.mjs <url> <nom> [--bureau|--mobile] [--pleine-page]` :
  écrit `design/site/rendus/<nom>-bureau.png` (1440×900) et `<nom>-mobile.png` (390×844),
  puis affiche les erreurs de la console.
- Pour les états qui demandent d'agir, écris tes scripts dans `design/site/parcours/` sur le
  modèle de `design/site/outils/exemple-parcours.mjs`.
- `design/site/outils/temps.sh` : le temps restant.
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

À la fin seulement, écris `design/site/NOTE.md` : le concept en trois lignes, la liste des
écrans avec leur adresse, et ce que tu aurais fait avec plus de temps.
</livraison>
