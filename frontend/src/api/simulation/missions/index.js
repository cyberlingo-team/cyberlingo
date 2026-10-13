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

import abonnementSuspendu from './abonnement-suspendu.js'
import adressePiegee from './adresse-piegee.js'
import amendeExpress from './amende-express.js'
import arnaqueSentiments from './arnaque-sentiments.js'
import boutiqueTropBelle from './boutique-trop-belle.js'
import boxDuSalon from './box-du-salon.js'
import cameraBavarde from './camera-bavarde.js'
import carnetDeDisquette from './carnet-de-disquette.js'
import chantageWebcam from './chantage-webcam.js'
import cleUsb from './cle-usb.js'
import code0000 from './code-0000.js'
import codeSmsAmi from './code-sms-ami.js'
import colisFantome from './colis-fantome.js'
import cookiesEtDroits from './cookies-et-droits.js'
import coucouPapa from './coucou-papa.js'
import deuxiemeVerrou from './deuxieme-verrou.js'
import disqueQuiClaque from './disque-qui-claque.js'
import ecranQuiHurle from './ecran-qui-hurle.js'
import fauxAcheteur from './faux-acheteur.js'
import fauxConseiller from './faux-conseiller.js'
import fraudeAuPresident from './fraude-au-president.js'
import lampeCurieuse from './lampe-curieuse.js'
import memeMotDePasse from './meme-mot-de-passe.js'
import messagesSecrets from './messages-secrets.js'
import phraseDePasse from './phrase-de-passe.js'
import pieceJointe from './piece-jointe.js'
import plusTard from './plus-tard.js'
import qrCodeColle from './qr-code-colle.js'
import wifiGratuit from './wifi-gratuit.js'

// L'ordre de parution : un jour, une mission, puis la suivante, et l'on reboucle (voir
// calendar.js). Deux missions voisines, la dernière et la première comprises, n'invitent
// jamais le même membre de la bande et ne parlent pas du même sujet.
export const MISSIONS = [
  lampeCurieuse,
  codeSmsAmi,
  cleUsb,
  fauxAcheteur,
  chantageWebcam,
  messagesSecrets,
  pieceJointe,
  cookiesEtDroits,
  code0000,
  colisFantome,
  phraseDePasse,
  ecranQuiHurle,
  boxDuSalon,
  adressePiegee,
  coucouPapa,
  plusTard,
  memeMotDePasse,
  boutiqueTropBelle,
  arnaqueSentiments,
  cameraBavarde,
  qrCodeColle,
  fauxConseiller,
  carnetDeDisquette,
  wifiGratuit,
  abonnementSuspendu,
  fraudeAuPresident,
  disqueQuiClaque,
  amendeExpress,
  deuxiemeVerrou,
]
