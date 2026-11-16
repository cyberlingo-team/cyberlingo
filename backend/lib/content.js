// Le contenu du jeu et ses règles. Ils sont écrits une seule fois, dans le dossier du serveur
// simulé de l'interface (frontend/src/api/simulation/), et le vrai serveur les reprend tels
// quels : les deux ne peuvent pas se contredire. Ce sont des modules JavaScript sans dépendance,
// qui tournent aussi bien dans Node que dans le navigateur.
//
// Les épisodes eux-mêmes (questions et réponses) sont versés dans la base par seed.js ; le
// serveur les lit ensuite dans la table Mission.

// Stades du Tux, barème des points, économie de la banquise (sardines, bouées, glaçons).
export * from '../../frontend/src/api/simulation/rules.js'
// La bande à Tux et Léopold.
export { GANG, VILLAIN, DISGUISES } from '../../frontend/src/api/simulation/cast.js'
// Les six thèmes du chemin, et le chemin lui-même : leçons, coffres et bilans dans l'ordre.
export { UNITS, CHEST_AFTER } from '../../frontend/src/api/simulation/units.js'
export { NODES, nodeById, unitById, lessonContent, missionById } from '../../frontend/src/api/simulation/path.js'
