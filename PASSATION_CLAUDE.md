# Passation : CyberLingo version appli (branche `version-duo`)

État au 22 octobre 2026. La copie locale de Duolingo réalisée par Codex a servi de référence de
mise en page, puis a été **entièrement remplacée** par l'identité et le contenu de CyberLingo :
plus aucune ressource, aucun texte ni aucune police de Duolingo dans l'arbre de travail.

**Attention avant toute publication** : l'historique de `version-duo` contient encore les
commits de la copie (ressources de `frontend/public/duolingo-local/`, propriété de Duolingo).
Avant de pousser cette branche, il faut réécrire ou écraser cet historique (par exemple un seul
commit depuis `main`). Alexis décide ; rien n'est poussé.

## Ce qui existe

- **Le chemin** (`/apprendre`) : six thèmes, 29 leçons tirées des missions, un coffre par thème,
  un bilan par thème ; la mission du jour en tête. Contenu dans
  `frontend/src/api/simulation/units.js` et `path.js`.
- **L'écran de leçon** (`/lecon/:id`, `/mission-du-jour`) : une question à la fois, tuiles,
  indices à toucher dans l'objet, correction en bas, bilan (points, sardines, Tux qui grandit,
  Léopold démasqué pour la mission du jour, quêtes remplies).
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
| `frontend/src/components/app/` | Coque (barre latérale, compteurs, onglets mobiles), cartes de droite, icônes, panneau d'état |
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
- Les objets examinés gardent le trait noir de la version BD.
