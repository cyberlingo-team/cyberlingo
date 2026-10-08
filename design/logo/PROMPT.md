<contexte>
CyberLingo est un site web que quatre étudiants de l'N7, une école d'ingénieurs de Toulouse,
construisent pour leur cours de développement web : « le Duolingo de la cybersécurité ».
Chaque jour, une mission commune à tout le monde apprend un bon réflexe : repérer un mail
de phishing, choisir un mot de passe, comprendre ce qui circule sur un réseau.

Le logo vivra à quatre endroits : l'onglet du navigateur, à 16 pixels ; l'en-tête du site ;
l'écran d'accueil ; et la toute première seconde de la vidéo de présentation du projet,
projetée devant l'enseignant et le reste de la promotion. Ce public connaît par cœur les deux
personnages dont le logo est né. Ce qui doit se passer dans leur tête : un sourire de
reconnaissance immédiat, « c'est les deux à la fois », puis l'envie de regarder de plus près.
</contexte>

<challenge>
Crée le logo de CyberLingo, entièrement en code, né de la rencontre de Tux, le manchot de
Linux, et de Duo, la chouette de Duolingo.

Les deux personnages : `references/tux.png` et `references/duo.png`.

La sensation visée : espiègle, attachant, vigilant, inoubliable.
</challenge>

<liberte-creative>
Donne toujours la priorité à la créativité. Prends des décisions audacieuses, inattendues, et
développe un concept original plutôt que de suivre les conventions familières des logos et
des mascottes.

Tu as une liberté créative complète sur le personnage, sa posture, son regard, ce qu'il
raconte, la manière dont les deux héritages se mêlent, les couleurs, le trait, la présence ou
non du nom, et le mouvement. Utilise les deux personnages de la manière qui crée l'effet le
plus fort : fusionne-les, échange leurs traits, déforme-les, simplifie-les jusqu'à l'os. Ne
colle pas une tête de chouette sur le corps de Tux, ne repeins pas Tux en vert, et n'appelle
pas ça une fusion. Traite-les comme de la matière brute pour un personnage neuf, qui n'aurait
sa place ni chez Linux ni chez Duolingo.

N'ajoute aucun des symboles que tout le monde attend pour dire « cybersécurité » : cadenas,
bouclier, clé, capuche ou cagoule de hacker, code binaire, pluie de caractères verts. Évite
l'esthétique générique des logos tech : dégradé violet-bleu, contour néon, monogramme dans un
cercle, pictogramme plat sans personnalité.
</liberte-creative>

<contraintes>
- Tout est dessiné par toi, en SVG écrit à la main. Les références sont des images à regarder,
  pas de la matière à décalquer : aucun tracé repris, aucune image bitmap intégrée.
- Livrable obligatoire : `livrables/logo-mark.svg`, le symbole seul, dans un viewBox carré.
  Il reste reconnaissable à 32 pixels et lisible en favicon à 16 pixels, sur fond clair comme
  sur fond sombre.
- Chaque SVG livré s'affiche correctement dans une balise `<img>` : aucune ressource externe,
  aucune police, aucun script. Si tu dessines le nom, ses lettres sont des tracés vectoriels,
  et il s'écrit exactement « CyberLingo ».
- Tu écris uniquement dans `livrables/` et `rendus/`. Ne modifie ni `outils/`, ni
  `references/`, ni rien d'autre dans le dépôt. Ne fais aucun commit.
- Tu disposes de 25 minutes à partir de ton lancement. Ensuite ta session est coupée net,
  sans avertissement. `outils/temps.sh` te dit où tu en es. Dès qu'une première version tient
  debout, `livrables/logo-mark.svg` doit en permanence contenir une version complète et
  valide : ce qui est sur le disque au moment de la coupure est ce qui sera livré.
</contraintes>

<harnais>
Ces outils sont déjà installés et testés. Ne les modifie pas.

- `outils/rendre.sh <fichier.svg|.html> <sortie.png> [largeur] [hauteur] [fond]` rend un SVG
  ou une page HTML en PNG avec Chrome.
- `outils/banc.sh` place `livrables/logo-mark.svg`, et `livrables/logo.svg` s'il existe, sur
  un banc d'essai : tailles de 320 à 16 pixels, fond clair, fond sombre, silhouette d'une
  seule couleur, favicon dans un onglet. Il produit `rendus/banc.png`.
- `outils/temps.sh` affiche le temps écoulé et le temps restant.
</harnais>

<livraison>
Construis le logo dans `livrables/`. Tu peux y ajouter tout autre fichier qui sert le concept.

Regarde ce que tu produis. Après chaque changement important, lance `outils/banc.sh` et ouvre
réellement `rendus/banc.png` ; rends aussi tes essais en grand avec `outils/rendre.sh` et
regarde-les. Itère jusqu'à ce que ce soit réellement bien, pas jusqu'à ce que ça marche.

N'explique pas le concept avant de le construire. Prends les décisions créatives toi-même et
livre le résultat le plus original et le plus abouti dont tu es capable.

Quand c'est fini, et seulement à ce moment-là, écris dans `livrables/NOTE.md` cinq lignes au
plus : l'idée du personnage et la liste des fichiers livrés.
</livraison>
