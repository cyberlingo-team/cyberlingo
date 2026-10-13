// Les crédits du site : d'où viennent les images, les polices et les conseils. Ce n'est pas une
// donnée du jeu mais la notice des fichiers livrés avec l'interface ; elle reprend
// design/site/matiere/CREDITS.md et signale chaque fichier modifié pour le site.

export const LICENSES = {
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/deed.fr',
  'Licence Art Libre': 'https://artlibre.org/licence/lal/',
  WTFPL: 'http://www.wtfpl.net/',
  'CC0 (domaine public)': 'https://creativecommons.org/publicdomain/zero/1.0/deed.fr',
  'SIL Open Font License 1.1': 'https://openfontlicense.org/',
  MIT: 'https://opensource.org/license/mit',
}

const CROPPED = 'Modifiée pour le site : marges recadrées, convertie en WebP.'
const VECTOR = 'Modifiée pour le site : dessin vectoriel converti en image, marges recadrées, converti en WebP.'

// La bande à Tux : un fichier de design/site/matiere/famille/ par personnage.
export const GANG_CREDITS = [
  {
    id: 'gaucho',
    title: 'Tuxgaucho',
    authors: 'dessin de Vinicius Stein, mise au propre de David Vignoni',
    license: 'Licence Art Libre',
    source: 'https://commons.wikimedia.org/wiki/File:Tuxgaucho.png',
    changes: 'Modifiée pour le site : convertie en WebP.',
  },
  {
    id: 'panic',
    title: 'LinuxPanic Logo',
    authors: 'LinuxPanic',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:LinuxPanic_Logo.png',
    changes: CROPPED,
  },
  {
    id: 'ball-and-chain',
    title: 'Projet mascotte JREL',
    authors: 'Lilyu',
    license: 'WTFPL',
    source: 'https://commons.wikimedia.org/wiki/File:Projet_mascotte_JREL.png',
    changes: CROPPED,
  },
  {
    id: 'pipe',
    title: 'Slackware mascot',
    authors: 'source http://www.slackware.com/~msimons/slackware/grfx/',
    license: 'usage libre (copyrighted free use)',
    source: 'https://commons.wikimedia.org/wiki/File:Slackware-mascot.svg',
    changes: VECTOR,
  },
  {
    id: 'tinfoil-hat',
    title: 'Tinfoil Hat Linux',
    authors: 'Ryan Reich (Wikipédia en anglais)',
    license: 'licence BSD',
    source: 'https://commons.wikimedia.org/wiki/File:Tinfoillinux.jpg',
    changes:
      'Recadrée et texte d’origine retiré dans la matière fournie, puis modifiée pour le site : fond blanc rendu transparent, marges recadrées, convertie en WebP.',
  },
  {
    id: 'hard-hat',
    title: 'Gulcrtux',
    authors: 'd’après Tux de Larry Ewing (lewing@isc.tamu.edu) et The GIMP',
    license: 'libre, mention des auteurs',
    source: 'https://commons.wikimedia.org/wiki/File:Gulcrtux.png',
    changes: CROPPED,
  },
  {
    id: 'server-rack',
    title: 'Cirpack LINUX tux 2',
    authors: 'nlebihan',
    license: 'domaine public',
    source: 'https://commons.wikimedia.org/wiki/File:Cirpack_LINUX_tux_2.png',
    changes: 'Modifiée pour le site : parties transparentes du ventre remplies de blanc, convertie en WebP.',
  },
  {
    id: 'floppy',
    title: 'Logiciels Libres Copy Left',
    authors: 'Ponsfrilus (Wikipédia en français)',
    license: 'domaine public',
    source: 'https://commons.wikimedia.org/wiki/File:Logiciels_Libres_Copy_Left.png',
    changes: CROPPED,
  },
  {
    id: 'remote',
    title: 'Tux holding remote',
    authors: 'Cyphermox',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Tux-holding-remote.png',
    changes: CROPPED,
  },
  {
    id: 'styrian-hat',
    title: 'Logo der Grazer Linuxtage (Steirertux)',
    authors: 'Florian Klien',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Logo_der_Grazer_Linuxtage_(Steirertux).svg',
    changes: VECTOR,
  },
  {
    id: 'classic',
    title: 'Tux3color',
    authors: 'Larry Ewing, Simon Budig, Garrett LeSage',
    license: 'CC0 (domaine public)',
    source: 'https://commons.wikimedia.org/wiki/File:Tux3color.webp',
    changes: 'Modifiée pour le site : marges recadrées, réduite.',
  },
  {
    id: 'flat',
    title: 'Tux Classic flat look 3D',
    authors: 'Larry Ewing, Sergey Smith (FoxyRiot)',
    license: 'libre, mention des auteurs',
    source: 'https://commons.wikimedia.org/wiki/File:Tux_Classic_flat_look_3D.svg',
    changes: VECTOR,
  },
]

// Les images créées pour CyberLingo pendant la construction du site.
export const CREATED_IMAGES = [
  'Tux le prof à la loupe, la main sur le front, en pleine lecture, perdu, et débranché',
  'l’œuf du joueur qui n’a pas encore de compte',
  'Léopold sans déguisement, Léopold démasqué, et ses onze déguisements : pêcheur, livreur, conseiller bancaire, technicien, séducteur, grand patron, vendeur, faux agent officiel, faux proche, serveur de café, colleur d’autocollants',
]

export const FONTS = [
  {
    name: 'Anybody',
    use: 'titres, logo et pseudos musclés',
    copyright: 'Copyright 2020 The Anybody Project Authors',
    source: 'https://github.com/Etcetera-Type-Co/Anybody',
  },
  {
    name: 'Playpen Sans',
    use: 'bulles, récitatifs et texte courant',
    copyright: 'Copyright 2023 The Playpen Sans Project Authors',
    source: 'https://github.com/TypeTogether/Playpen-Sans',
  },
]

export const SOURCES = [
  { name: 'ANSSI', url: 'https://cyber.gouv.fr/' },
  { name: 'CNIL', url: 'https://www.cnil.fr/' },
  { name: 'Cybermalveillance.gouv.fr', url: 'https://www.cybermalveillance.gouv.fr/' },
]

export const TEAM = ['Alexis Briend', 'Théophane Chollet', 'Mathéo Depuydt', 'Benjamin Sarrat']
