export default {
  id: 'lampe-curieuse',
  title: 'La lampe qui voulait tout voir',
  theme: 'Permissions des applis',
  guest: 'tinfoil-hat',
  villain: null,
  hook: 'Alu installe une simple lampe torche sur son téléphone. Elle a beaucoup de questions.',
  questions: [
    {
      id: 'lampe',
      kind: 'trap',
      scene: '22 h 10. Panne de courant chez Alu. Il installe en vitesse l’appli Lampe Éclair.',
      line: 'Vite, je n’y vois rien ! J’accepte tout et on n’en parle plus ?',
      artifact: {
        kind: 'app',
        app: 'Lampe Éclair',
        title: '{{demande|Autoriser Lampe Éclair à accéder à vos contacts ?}}',
        body: ['{{raison|Pour améliorer votre expérience d’éclairage.}}'],
        buttons: ['Refuser', 'Autoriser'],
      },
      prompt: 'Cette demande, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Une lampe torche n’a aucun besoin de tes contacts : c’est justement l’exemple de demande excessive que donne la CNIL. Une autorisation doit correspondre à ce que fait l’appli. Ici, on refuse ; et au moindre doute, on choisit une autre appli.',
      notes: [
        { zone: 'demande', text: 'Les contacts, pour une lampe : rien à voir avec sa fonction.' },
        { zone: 'raison', text: 'Une raison vague, qui n’explique rien.' },
      ],
      success: 0.86,
    },
    {
      id: 'bus',
      kind: 'trap',
      scene: 'Le lendemain. Alu installe Bus Banquise, l’appli des bus de sa ville, pour voir les prochains passages.',
      line: 'Et celle-là veut savoir où je suis ! Je le savais, on m’espionne…',
      artifact: {
        kind: 'app',
        app: 'Bus Banquise',
        title: '{{demande|Autoriser Bus Banquise à utiliser votre position ?}}',
        body: ['{{raison|Pour afficher les arrêts les plus proches de vous.}}'],
        buttons: ['{{pendant|Uniquement lorsque l’app est utilisée}}', 'Une seule fois', 'Refuser'],
      },
      prompt: 'Cette demande, piège ou pas ?',
      answer: 'safe',
      explanation:
        'Pour montrer les arrêts les plus proches, une appli de bus a vraiment besoin de la position : la demande correspond au service, et la raison est claire. Alu peut accepter en choisissant « Uniquement lorsque l’app est utilisée », comme le conseille la CNIL. Et il pourra changer d’avis à tout moment dans les réglages du téléphone.',
      notes: [
        { zone: 'raison', text: 'Une raison claire, liée au service rendu.' },
        { zone: 'pendant', text: 'Le bon choix : la position seulement quand Alu regarde l’appli.' },
      ],
      success: 0.58,
    },
    {
      id: 'mise-a-jour',
      kind: 'truefalse',
      scene: 'Une semaine plus tard. Bus Banquise vient de se mettre à jour.',
      line: 'J’ai réglé ses autorisations le premier jour. Plus besoin d’y toucher, non ?',
      prompt: 'Après une mise à jour, mieux vaut revérifier les autorisations d’une appli.',
      answer: true,
      explanation:
        'Les autorisations d’une appli peuvent évoluer avec ses mises à jour. Cybermalveillance.gouv.fr conseille de les vérifier à l’installation, mais aussi après ses mises à jour. Et de temps en temps, un tour dans les réglages permet de retirer ce qui ne se justifie plus.',
      success: 0.74,
    },
    {
      id: 'menage',
      kind: 'clues',
      scene: 'Dimanche. Alu fait le grand ménage dans les autorisations de son téléphone.',
      line: 'Montrez-vous, les curieuses !',
      artifact: {
        kind: 'app',
        app: 'Réglages',
        title: 'Autorisations des applis',
        body: [
          '{{bus|Bus Banquise : position, lorsque l’app est utilisée}}',
          '{{solitaire|Solitaire Givré : contacts, appareil photo et position}}',
          '{{retouche|Retouche Pingouin : photos sélectionnées}}',
          '{{meteo|Météo Banquise : position, toujours}}',
          '{{visio|Allô Banquise : micro et caméra}}',
        ],
      },
      prompt: 'Touche les 2 autorisations qu’Alu devrait revoir.',
      pick: 2,
      answer: ['solitaire', 'meteo'],
      explanation:
        'Un jeu de cartes n’a besoin ni des contacts, ni de l’appareil photo, ni de la position : c’est le genre de demande suspecte que cite Cybermalveillance.gouv.fr. Une météo n’a pas besoin de suivre Alu en permanence : « lorsque l’app est utilisée » suffit. Le micro et la caméra d’une appli d’appels vidéo, eux, servent vraiment.',
      notes: [
        { zone: 'solitaire', text: 'Un jeu de cartes qui veut contacts, photos et position : suspect.' },
        { zone: 'meteo', text: '« Toujours » : la météo n’a pas besoin de le suivre partout.' },
        { zone: 'visio', text: 'Micro et caméra pour des appels vidéo : logique.' },
        { zone: 'bus', text: 'Seulement pendant l’utilisation : parfait.' },
      ],
      success: 0.62,
    },
    {
      id: 'choisir',
      kind: 'choice',
      scene: '18 h 00. Alu cherche une nouvelle lampe torche. Une lampe, et rien d’autre.',
      line: 'Cette fois, je choisis mieux. Mais comment ?',
      prompt: 'Quelle est la meilleure façon de choisir ?',
      options: [
        { id: 'parallele', text: 'Sur un site inconnu qui offre la version « premium » gratuitement.' },
        { id: 'avis', text: 'Dans le magasin officiel, en lisant les avis et les autorisations demandées.' },
        { id: 'aveugle', text: 'Dans le magasin officiel, sans rien regarder : tout y est vérifié.' },
        { id: 'pub', text: 'Prendre la première qui passe en publicité : si elle fait de la pub, elle est connue.' },
      ],
      answer: 'avis',
      explanation:
        'Les magasins officiels limitent le risque d’applis piégées, sans le supprimer. Avant d’installer, regarde les avis, les notes et les autorisations demandées ; au moindre doute, choisis-en une autre. Quant aux sites qui offrent gratuitement des applis normalement payantes, leurs applis sont généralement piégées.',
      success: 0.71,
    },
  ],
  moral:
    'Avant d’accepter une autorisation, demande-toi si l’appli en a vraiment besoin. La position ? Seulement pendant l’utilisation. Revérifie après les mises à jour, et installe tes applis depuis les magasins officiels, en lisant les avis.',
  sources: [
    { label: 'CNIL : les permissions dans les applications mobiles', url: 'https://www.cnil.fr/fr/permissions-applications-mobiles-recommandations-de-la-cnil-pour-respecter-la-vie-privee' },
    { label: 'CNIL : géolocalisation et applications mobiles', url: 'https://www.cnil.fr/fr/geolocalisation-applications-mobiles-proteger-vos-donnees' },
    { label: 'Cybermalveillance.gouv.fr : sécuriser ses appareils mobiles', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/appareils-mobiles' },
  ],
}
