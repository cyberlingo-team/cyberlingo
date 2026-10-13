// Le contenu des missions. Le futur serveur pourra importer ce tableau tel quel dans son
// seed.js : ce sont des données, pas du code d'interface.
//
// Une mission :
//   id        identifiant de contenu (le serveur, lui, désigne une mission par sa date)
//   title     titre de l'épisode          theme   catégorie courte
//   guest     membre de la bande invité (voir cast.js)
//   villain   déguisement de Léopold à la fin, ou null si personne n'arnaque personne
//   hook      une phrase d'accroche, reprise dans « À suivre »
//   questions de 4 à 5 :
//     kind      'trap' (piège ou fiable), 'truefalse', 'choice' ou 'clues' (trouver les indices)
//     scene     le récitatif (la situation)     line   ce que dit l'invité (facultatif)
//     artifact  l'objet à examiner (SMS, mail, appel, page web…), facultatif
//     prompt    la question posée au joueur
//     options   pour 'choice' : [{ id, text }]
//     answer    'trap' | 'safe' ; true | false ; id de l'option ; liste des zones-indices
//     pick      pour 'clues' : nombre d'indices à trouver
//     explanation  l'explication, montrée après la réponse
//     notes     annotations posées sur l'artefact après la réponse : [{ zone, text }]
//     success   part des joueurs qui répondent juste (sert à simuler les statistiques)
//   moral     la moralité, le réflexe à retenir
//   sources   pages officielles : [{ label, url }]
//
// Dans les textes des artefacts, {{zone|texte}} délimite une zone qu'on peut toucher ou annoter.

import colisFantome from './colis-fantome.js'

export const MISSIONS = [colisFantome]
