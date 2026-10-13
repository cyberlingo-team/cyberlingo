# CyberLingo, version Tux : note de livraison

## Le concept

Chaque jour paraît un épisode de bande dessinée, le même pour tout le monde : Tux le prof et un
membre de sa bande y croisent Léopold, un léopard de mer escroc qui change de déguisement à
chaque arnaque. Le joueur avance case par case, examine le SMS, le mail ou la page du jour,
répond, et la correction s'écrit sur l'objet lui-même. À la fin, Léopold est démasqué et les
points font prendre du muscle au Tux du joueur, du poussin au brise-glace ; « À suivre » annonce
l'épisode de demain.

## Les écrans

| Adresse | Écran |
|---|---|
| `/` | L'épisode du jour. Un visiteur lit la couverture et répond à la première case sans compte ; ses réponses le suivent s'il en crée un. Un joueur voit d'abord « Précédemment » (sa série, son Tux), puis l'épisode, puis la fin : Léopold démasqué, la moralité, les sources, les points gagnés, le rang de la semaine et « À suivre ». Épisode déjà fait : le résumé de sa partie et l'annonce de demain. |
| `/episode/AAAA-MM-JJ` | Un épisode déjà paru : relu avec sa correction s'il a été joué, rattrapé sans points sinon. `/episode/2020-01-01` (avant le lancement) et `/episode/2099-01-01` (pas encore paru) affichent « Aucun épisode à cette date ». L'épisode du jour renvoie vers `/`. |
| `/episodes` | Les épisodes parus, semaine par semaine, avec trois filtres : tous, à rattraper, joués. |
| `/classement` | Le classement de la semaine : le podium, puis le joueur à sa place parmi ses voisins, et les points qui le séparent de celui de devant. |
| `/classement?periode=tout` | Le classement depuis le lancement. |
| `/mon-tux` | Le Tux du joueur à son stade, les points qui manquent pour le suivant, l'échelle des huit stades, sa série, ses sept derniers jours et son bilan. |
| `/la-bande` | Les douze Tux de la bande, et Léopold avec les déguisements déjà démasqués par le joueur. |
| `/connexion` | Se connecter. |
| `/inscription` | Créer son compte : pseudo et mot de passe, avec une jauge de robustesse alignée sur la recommandation de la CNIL. |
| `/mon-compte` | Changer de pseudo ou de mot de passe, se déconnecter, supprimer son compte. Réservée aux joueurs connectés. |
| `/credits` | Les crédits : le logo, les images de la bande et leurs licences, les images créées, les polices, les sources du contenu. Liée depuis le pied de chaque page. |
| toute autre adresse | La page introuvable (essayer `/nulle-part`). |

Les états difficiles s'obtiennent depuis l'adresse, et le mode choisi vaut pour tout l'onglet :
`?simulation=lent` (chargements), `?simulation=panne` (serveur qui ne répond pas),
`?simulation=normal`, `?simulation=reinitialiser` (efface les comptes créés et les parties
jouées dans ce navigateur). Les animations se coupent depuis le pied de page, et d'office quand
le système demande de les réduire ; les bruitages, coupés au départ, s'y allument.

Comptes de démonstration, mot de passe `banquise-sardine-parapluie` : `sacha_31` (une série en
cours, l'épisode du jour à faire), `malo.dlt` (une série perdue hier),
`Capitaine_des_mots_de_passe_42` (trente caractères, l'épisode du jour déjà fait). Le tout
premier jour se voit en créant un compte.

Les parcours qui produisent les captures sont dans `design/site/parcours/` (un script par
parcours, plus les cas limites et le tour de toutes les adresses) ; les captures sont dans
`design/site/rendus/`, ignoré par git.

## Ce qui reste imparfait

- **La dernière relecture des faits n'a pas eu lieu.** Quatre relecteurs revérifiaient les
  épisodes contre les sources quand la session s'est arrêtée ; leurs rapports sont perdus. Le
  contenu a été vérifié avant l'écriture, pas après.
- **Pas de serveur.** Tout tourne contre le serveur simulé de `frontend/src/api/simulation/`,
  qui garde ses données dans le `localStorage` du navigateur : rien n'est partagé entre deux
  navigateurs. Il hache les mots de passe en SHA-256 salé, faute de bcrypt dans le navigateur ;
  le vrai serveur utilisera bcryptjs, comme le décrit `frontend/src/api/CONTRAT.md`.
- **Les comptes de démonstration repartent chaque jour de leur état de départ** : leur passé se
  recale sur la date du jour, et ce qu'on a joué avec eux la veille est effacé. Les comptes créés
  dans le navigateur, eux, gardent tout.
- **L'espace fine insécable** (séparateur des milliers, espace avant « ? ! ; ») manque aux deux
  polices : le navigateur la prend dans une police de secours. Elle reste fine, un huitième de
  cadratin, si bien que « 1 114 » se lit serré dans les petits textes.
- **Les ex aequo partagent leur rang**, et le rang suivant saute un numéro (1, 2, 2, 4) : c'est
  la règle sportive, mais elle surprend au premier coup d'œil.
- **Sur téléphone, la page des épisodes est longue** : quatre semaines d'épisodes, sans
  pagination. Les filtres la raccourcissent ; sous 380 px de large, ils passent sur deux lignes.
- **Sur ordinateur, la colonne reste étroite** (760 px) : c'est voulu, une case de BD se lit
  mieux ainsi, mais l'écran large reste en partie vide.
- **Les noms de domaine des arnaques sont inventés** et n'existaient pas au moment de l'écriture
  (vérifié par DNS) ; rien n'empêche quelqu'un de les déposer plus tard.
- **Images générées** : 19 sur les 40 autorisées, toutes créditées. Le compteur du harnais en
  affiche 15, parce que des générations lancées en parallèle se sont écrasé le compteur.
- **Sur les captures pleine page**, la barre d'onglets fixée en bas de l'écran du téléphone
  apparaît au milieu de l'image : c'est un effet de la capture, pas du site.
