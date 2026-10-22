# Passation : CyberLingo version appli (branche `version-duo`)

État au 22 octobre 2026. L'interface **repart du code de la copie de Codex** (gabarits, CSS,
déroulé des écrans), passée aux couleurs, aux images et au contenu de CyberLingo. Les données
viennent toutes du serveur simulé, par `frontend/src/api/`. Plus aucune ressource, aucun texte ni
aucune police de Duolingo dans l'arbre de travail.

Une première version réécrivait les écrans de zéro ; Alexis l'a jugée moins agréable que la copie
(l'écran de question surtout), d'où la reprise. La copie d'origine reste consultable sur la
branche locale `copie-codex` (commit 74c044a).

**Attention avant toute publication** : l'historique de `version-duo` contient encore les
commits de la copie (ressources de `frontend/public/duolingo-local/`, propriété de Duolingo).
Avant de pousser cette branche, il faut réécrire ou écraser cet historique (par exemple un seul
commit depuis `main`). Alexis décide ; rien n'est poussé.

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

## Reste à faire

- Réécrire l'historique de la branche avant tout push (voir plus haut).
- Le vrai back-end Express 5 + Prisma 7 + PostgreSQL, en suivant `CONTRAT.md`.
- La relecture des faits du contenu, interrompue dans la version BD.
- Écarts restants avec la copie : sur téléphone, la barre des compteurs reste affichée sur Quêtes
  et Mon Tux ; pas de page `/succes` (« Afficher tout » déplie la liste dans Mon Tux) ; le défi du
  mois apparaît deux fois entre 700 et 1079 px de large.
- Les leçons du chemin reprennent les questions des missions.
