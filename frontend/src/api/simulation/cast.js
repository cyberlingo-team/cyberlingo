// La bande à Tux : les douze Tux de la famille, invités tour à tour dans les missions.
// L'identifiant sert à l'interface pour retrouver l'image ; le reste est du contenu.

export const GANG = {
  gaucho: {
    id: 'gaucho',
    name: 'Gaucho',
    tagline: 'Dégaine son téléphone plus vite que son ombre.',
    look: 'Tux en gaucho, chapeau de paille et foulard rouge, une calebasse à la main.',
  },
  panic: {
    id: 'panic',
    name: 'Panique',
    tagline: 'Croit tout ce qui clignote en rouge.',
    look: 'Tux assis derrière un gros bouton rouge marqué « Panic ! ».',
  },
  'ball-and-chain': {
    id: 'ball-and-chain',
    name: 'Boulet',
    tagline: 'Traîne toutes les mauvaises habitudes, une par une.',
    look: 'Tux qui scie la chaîne d’un boulet attaché à sa patte.',
  },
  pipe: {
    id: 'pipe',
    name: 'l’Inspecteur',
    tagline: 'Ne clique jamais sans avoir enquêté.',
    look: 'Tux assis, une pipe au bec.',
  },
  'tinfoil-hat': {
    id: 'tinfoil-hat',
    name: 'Alu',
    tagline: 'Se méfie de tout, même de son grille-pain.',
    look: 'Tux coiffé d’un chapeau en papier d’aluminium.',
  },
  'hard-hat': {
    id: 'hard-hat',
    name: 'Chantier',
    tagline: 'Toujours en travaux, rarement à jour.',
    look: 'Tux au casque de chantier blanc, une tasse à la main.',
  },
  'server-rack': {
    id: 'server-rack',
    name: 'Rack',
    tagline: 'Fait tourner le serveur du club de randonnée.',
    look: 'Tux accoudé à une grande baie de serveurs.',
  },
  floppy: {
    id: 'floppy',
    name: 'Disquette',
    tagline: 'Sauvegarde tout, même ses phrases de drague.',
    look: 'Tux qui serre une grosse disquette contre lui.',
  },
  remote: {
    id: 'remote',
    name: 'Zappeur',
    tagline: 'Branche à Internet tout ce qui a une prise.',
    look: 'Tux assis, une télécommande dans les ailes.',
  },
  'styrian-hat': {
    id: 'styrian-hat',
    name: 'Tyrol',
    tagline: 'Toujours en voyage, toujours sur le Wi-Fi du coin.',
    look: 'Tux au chapeau tyrolien vert orné d’une plume.',
  },
  classic: {
    id: 'classic',
    name: 'Tonton',
    tagline: 'Transfère tout à toute la famille.',
    look: 'Tux classique, assis, l’air bonhomme.',
  },
  flat: {
    id: 'flat',
    name: 'Flapi',
    tagline: 'Batterie à 3 %, prêt à se brancher n’importe où.',
    look: 'Tux dessiné à plat, l’air un peu fatigué.',
  },
}

// Léopold, le léopard de mer : l'escroc de la bande dessinée. Il change de déguisement selon
// l'arnaque du jour. Chaque déguisement a son image dans l'interface.
export const VILLAIN = {
  name: 'Léopold',
  tagline: 'Léopard de mer, escroc à plein temps. Change de déguisement plus souvent que de mot de passe.',
  // Ce qu'il marmonne quand on l'a démasqué (un par épisode, tiré selon la date).
  quips: [
    'Démasqué ? Pas grave. Demain, j’ai un autre costume.',
    'Qui a prévenu ce prof ?',
    'Bon. Je retourne au vestiaire.',
    'La prochaine fois, tu ne me reconnaîtras pas.',
    'Ce n’était qu’une répétition générale.',
    'J’avais pourtant mis ma plus belle moustache.',
  ],
}

export const DISGUISES = {
  fisher: 'en pêcheur',
  courier: 'en livreur',
  banker: 'en conseiller bancaire',
  techie: 'en technicien',
  charmer: 'en séducteur',
  boss: 'en grand patron',
  seller: 'en vendeur',
  official: 'en faux agent officiel',
  relative: 'en faux proche',
  waiter: 'en serveur de café',
  sticker: 'en colleur d’autocollants',
}
