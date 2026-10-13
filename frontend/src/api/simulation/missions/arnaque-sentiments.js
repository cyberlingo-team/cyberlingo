export default {
  id: 'arnaque-sentiments',
  title: 'Coup de foudre à distance',
  theme: 'Arnaque aux sentiments',
  guest: 'floppy',
  villain: 'charmer',
  hook: 'Le cœur de Disquette fait des bonds : chaque soir, Camille lui écrit depuis le bout du monde.',
  questions: [
    {
      id: 'demande',
      kind: 'trap',
      scene: '23 h. Depuis trois semaines, Disquette échange chaque soir avec Camille, photographe en expédition, via une appli de rencontre.',
      line: 'Un message de Camille ! Je le sauvegarde avant même de le lire.',
      artifact: {
        kind: 'chat',
        contact: 'Camille',
        messages: [
          { from: 'me', text: 'Encore debout ? Raconte-moi ta journée !', time: '23:01' },
          { from: 'them', text: 'Une tempête a tout emporté au camp de base. {{argent|Il me faut 1 200 € ce soir}}, sinon l’expédition s’arrête.', time: '23:02' },
          { from: 'them', text: '{{rembourse|Je te rembourse dès mon retour, promis.}} {{excuse|Pas de vidéo : ma caméra est cassée.}}', time: '23:03' },
          { from: 'them', text: '{{secret|Surtout, n’en parle à personne.}} Les autres ne comprendraient pas.', time: '23:03' },
        ],
      },
      prompt: 'Ce message de Camille, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Une demande d’argent urgente, après trois semaines d’échanges sans jamais se voir : c’est le cœur de l’arnaque aux sentiments. L’excuse pour ne pas se montrer et la consigne du secret complètent le tableau. Règle d’or : jamais d’argent à une personne qu’on ne connaît qu’en ligne ou par téléphone.',
      notes: [
        { zone: 'argent', text: 'Une somme précise, pour ce soir : l’urgence empêche de réfléchir.' },
        { zone: 'rembourse', text: 'Une promesse ne coûte rien à l’escroc.' },
        { zone: 'excuse', text: 'Toujours une excuse pour ne pas se montrer.' },
        { zone: 'secret', text: 'Éloigner Disquette de ses proches : un signal d’alerte.' },
      ],
      success: 0.83,
    },
    {
      id: 'relire',
      kind: 'clues',
      scene: '23 h 10. Disquette n’a rien envoyé. Chaque message de Camille a été sauvegardé : c’est l’heure de tout relire.',
      line: 'Avec le recul, certains messages me font tiquer.',
      artifact: {
        kind: 'chat',
        contact: 'Camille',
        messages: [
          { from: 'them', text: '{{vite|Deux jours qu’on se parle, et tu es déjà l’amour de ma vie.}}', time: 'Jour 2' },
          { from: 'me', text: 'Tu écoutes quoi, là-bas ?', time: 'Jour 4' },
          { from: 'them', text: '{{musique|Du jazz, surtout le soir, au chaud sous la tente.}}', time: 'Jour 4' },
          { from: 'them', text: '{{rencontre|On se voit à mon retour… Ah non, l’expédition est encore prolongée.}}', time: 'Jour 9' },
          { from: 'me', text: '{{photo|Regarde ce coucher de soleil sur la banquise !}}', time: 'Jour 12' },
          { from: 'them', text: '{{proches|Tes amis ne peuvent pas comprendre ce qu’on vit. Garde ça pour nous.}}', time: 'Jour 15' },
        ],
      },
      prompt: 'Trouve les 3 messages qui auraient dû alerter Disquette.',
      answer: ['vite', 'rencontre', 'proches'],
      pick: 3,
      explanation:
        'Une déclaration enflammée au bout de deux jours, une rencontre sans cesse repoussée, et l’envie d’éloigner Disquette de ses amis : ce sont les signes classiques d’une arnaque aux sentiments. Parler musique ou partager un paysage, en revanche, n’a rien de suspect.',
      notes: [
        { zone: 'vite', text: 'L’amour de sa vie en deux jours : beaucoup trop vite.' },
        { zone: 'rencontre', text: 'La rencontre est toujours repoussée, avec une nouvelle excuse.' },
        { zone: 'proches', text: 'Isoler de ses amis, pour mieux manipuler.' },
        { zone: 'musique', text: 'Parler musique : rien de suspect.' },
        { zone: 'photo', text: 'Un paysage ne dit rien de personnel.' },
      ],
      success: 0.58,
    },
    {
      id: 'photo-profil',
      kind: 'choice',
      scene: '23 h 20. Disquette regarde la photo de profil de Camille : veste rouge, grand sourire, glaciers. Presque trop belle.',
      line: 'Comment savoir si c’est vraiment Camille, sur cette photo ?',
      prompt: 'Quelle est la vérification la plus utile ?',
      options: [
        { id: 'inverse', text: 'Lancer une recherche d’image inversée sur cette photo.' },
        { id: 'autres', text: 'Demander à Camille d’autres photos, prises dans d’autres endroits.' },
        { id: 'zoom', text: 'Zoomer sur la photo pour vérifier qu’elle est nette et récente.' },
        { id: 'likes', text: 'Compter les « j’aime » sous la photo : beaucoup, c’est rassurant.' },
      ],
      answer: 'inverse',
      explanation:
        'La recherche d’image inversée, proposée par les principaux moteurs de recherche, montre si la photo circule déjà ailleurs, sous un autre nom. C’est le moyen de savoir si ce sont bien les photos de Camille. En demander d’autres ne prouve rien : on peut en voler plusieurs.',
      success: 0.66,
    },
    {
      id: 'video',
      kind: 'truefalse',
      scene: 'Le lendemain, Disquette se confie à Gaucho, qui a une idée : « Demande-lui un appel vidéo. Si Camille accepte, c’est réglé ! »',
      line: 'Une vidéo, ce serait une preuve, non ?',
      prompt: 'Un appel vidéo prouve que Camille est sincère.',
      answer: false,
      explanation:
        'Une vidéo montre un visage, pas des intentions. Cybermalveillance.gouv.fr rappelle que ces arnaques passent par la messagerie, le téléphone et même la visio. La règle ne change donc pas : pas d’argent à quelqu’un qu’on ne connaît qu’en ligne.',
      success: 0.6,
    },
    {
      id: 'reagir',
      kind: 'choice',
      scene: '20 h. Disquette a dit non. Camille insiste, puis menace : « Tu vas le regretter. » Il faut décider quoi faire.',
      line: 'Je réponds ? Ou je supprime tout et je n’y pense plus ?',
      prompt: 'Que doit faire Disquette maintenant ?',
      options: [
        { id: 'moitie', text: 'Envoyer la moitié de la somme, pour que Camille se calme.' },
        { id: 'couper', text: 'Couper le contact, garder les messages et signaler le profil à l’appli.' },
        { id: 'effacer', text: 'Tout effacer, conversation comprise, et faire comme si de rien n’était.' },
        { id: 'aveux', text: 'Écrire un long message pour pousser Camille à avouer.' },
      ],
      answer: 'couper',
      explanation:
        'On coupe le contact, même face aux menaces, et on garde les preuves : Disquette a bien fait de tout sauvegarder. On signale aussi le profil au site de rencontre. Comme il y a eu une demande d’argent, Disquette peut signaler les faits sur THESEE, ou y porter plainte, même sans avoir rien versé.',
      success: 0.7,
    },
  ],
  moral:
    'Quelqu’un que tu ne connais qu’en ligne te demande de l’argent ? N’envoie rien, jamais. Parles-en à un proche, vérifie ses photos par recherche inversée, et coupe le contact en gardant les preuves.',
  sources: [
    { label: 'Cybermalveillance.gouv.fr : réagir à une escroquerie sentimentale', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/comment-reagir-en-cas-descroquerie-sentimentale' },
    { label: 'Service-public.fr : arnaque aux sentiments, les démarches', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34124' },
  ],
}
