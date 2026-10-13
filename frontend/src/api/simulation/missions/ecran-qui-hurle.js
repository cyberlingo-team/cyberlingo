export default {
  id: 'ecran-qui-hurle',
  title: 'L’écran qui hurle',
  theme: 'Alerte à l’écran',
  guest: 'panic',
  villain: 'techie',
  hook: 'Panique cherche une recette de crêpes. Soudain, son ordinateur se met à hurler.',
  questions: [
    {
      id: 'alerte',
      kind: 'trap',
      scene: '19 h. Panique cherche une recette de crêpes. Soudain, une sirène retentit et l’écran vire au rouge.',
      line: 'Tout clignote en rouge ! C’est grave, c’est sûr. J’appelle le numéro !',
      artifact: {
        kind: 'popup',
        title: '{{titre|ALERTE DE SÉCURITÉ : ORDINATEUR BLOQUÉ}}',
        body: [
          '{{menace|Virus détecté ! Vos fichiers et vos mots de passe sont en danger.}}',
          '{{interdit|Ne fermez pas cette page et n’éteignez pas votre ordinateur.}}',
        ],
        phone: '{{numero|Assistance agréée : 04 65 71 20 85}}',
        buttons: ['Analyser maintenant'],
      },
      prompt: 'Cette alerte, piège ou pas ?',
      answer: 'trap',
      explanation:
        'C’est une fausse alerte, faite pour te faire peur : sirène, rouge, menaces. Son but : que tu appelles ce numéro, où un faux technicien te fera payer un « dépannage ». Aucun support technique officiel ne te demandera de l’appeler après une alerte de ce genre.',
      notes: [
        { zone: 'titre', text: 'Des majuscules et du rouge, pour t’affoler.' },
        { zone: 'menace', text: 'La peur de tout perdre, pour que tu obéisses vite.' },
        { zone: 'interdit', text: 'Une consigne pour te garder sous pression.' },
        { zone: 'numero', text: 'Le numéro des escrocs : n’appelle jamais un numéro affiché par une alerte.' },
      ],
      success: 0.8,
    },
    {
      id: 'fermer',
      kind: 'choice',
      scene: 'La sirène hurle toujours. Panique s’est caché derrière un coussin, la souris à la main.',
      line: 'Je n’arrive même plus à fermer la fenêtre ! Je fais quoi, moi ?',
      prompt: 'Que doit faire Panique ?',
      options: [
        { id: 'analyser', text: 'Cliquer sur « Analyser maintenant », pour mesurer les dégâts.' },
        { id: 'appeler', text: 'Appeler le numéro, mais sans jamais donner sa carte bancaire.' },
        { id: 'echap', text: 'Appuyer sur Échap ou F11, fermer la page, redémarrer au besoin.' },
        { id: 'attendre', text: 'Attendre sans rien toucher, comme l’alerte le lui demande.' },
      ],
      answer: 'echap',
      explanation:
        'N’appelle pas le numéro et ne clique sur rien dans l’alerte. Échap ou F11 fait sortir du plein écran : tu peux alors fermer la page. Si rien ne marche, redémarre l’ordinateur. Et prends d’abord une photo de l’écran : elle pourra servir de preuve.',
      success: 0.64,
    },
    {
      id: 'antivirus',
      kind: 'truefalse',
      scene: 'Ordinateur redémarré, silence revenu. Panique montre la photo de l’alerte à Disquette.',
      line: 'C’est mon antivirus qui a hurlé, j’en suis sûr. Le virus est encore là !',
      prompt: 'Cette alerte venait de l’antivirus de Panique.',
      answer: false,
      explanation:
        'Ce genre d’alerte ne vient ni de ton système ni de ton antivirus : c’est une page web frauduleuse, qui s’ouvre souvent après un clic sur une publicité ou un lien piégé. Si elle revient, nettoie ton navigateur : vide le cache et supprime les cookies.',
      success: 0.6,
    },
    {
      id: 'technicien',
      kind: 'clues',
      scene: 'Le lendemain, 10 h. Le téléphone de Panique sonne. Un « technicien » l’appelle, sans qu’il ait rien demandé.',
      line: 'Un technicien qui m’appelle, moi ? Je savais bien que c’était grave !',
      artifact: {
        kind: 'call',
        caller: 'Inconnu',
        number: '03 53 01 46 90',
        lines: [
          { who: 'caller', text: '{{bonjour|Bonjour monsieur}}, ici {{prenom|Marc}}, du support informatique. {{virus|Votre ordinateur nous signale un virus.}}' },
          { who: 'guest', text: 'Je le savais ! Qu’est-ce que je dois faire ?' },
          { who: 'caller', text: '{{distance|Installez ce logiciel : je prends la main à distance.}} {{payer|Le nettoyage coûte 299 €, par carte.}}' },
        ],
      },
      prompt: 'Touche les 3 indices qui trahissent le faux technicien.',
      pick: 3,
      answer: ['virus', 'distance', 'payer'],
      explanation:
        'Aucun support technique officiel ne t’appellera pour un virus. Avec la main sur ton ordinateur, un escroc peut fouiller tes fichiers et même tenter d’accéder à tes comptes bancaires. Raccroche, n’installe rien, ne paie rien. Le prénom et la politesse, eux, ne prouvent rien.',
      notes: [
        { zone: 'bonjour', text: 'La politesse ne prouve rien.' },
        { zone: 'prenom', text: 'Un prénom, ça s’invente.' },
        { zone: 'virus', text: 'Aucun support officiel n’appelle pour te signaler un virus.' },
        { zone: 'distance', text: 'Ne laisse jamais un inconnu prendre la main sur ton ordinateur.' },
        { zone: 'payer', text: 'Un faux dépannage, payé par carte : le vrai but de l’appel.' },
      ],
      success: 0.66,
    },
    {
      id: 'aide',
      kind: 'choice',
      scene: 'Panique a raccroché. Mais il tremble encore : et si son ordinateur était vraiment touché ?',
      line: 'J’ai besoin d’aide, mais de la vraie, cette fois. Je m’adresse à qui ?',
      prompt: 'Où peut-il trouver une aide fiable ?',
      options: [
        { id: 'pub', text: 'Chez le dépanneur de la première publicité trouvée en ligne.' },
        { id: 'rappel', text: 'Auprès du technicien d’hier : il avait l’air de s’y connaître.' },
        { id: 'forum', text: 'Sur un forum, auprès d’un inconnu qui propose de l’aider à distance.' },
        { id: 'diagnostic', text: 'Sur 17Cyber, le site d’aide de la police et de la gendarmerie.' },
      ],
      answer: 'diagnostic',
      explanation:
        '17Cyber, proposé par la police, la gendarmerie et Cybermalveillance.gouv.fr, pose un diagnostic en ligne et indique quoi faire. Cybermalveillance.gouv.fr recense aussi des professionnels qui peuvent t’aider. Méfie-toi des liens publicitaires, surtout quand ils promettent un dépannage.',
      success: 0.55,
    },
  ],
  moral:
    'Ton écran hurle au virus et affiche un numéro ? N’appelle pas. Échap ou F11, ferme la page, redémarre au besoin. Et ne laisse jamais un inconnu prendre la main sur ton ordinateur.',
  sources: [
    { label: 'Cybermalveillance.gouv.fr : l’arnaque au faux support technique', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/arnaques-au-faux-support-technique' },
    { label: '17Cyber : l’assistance en ligne aux victimes de cybermalveillance', url: 'https://17cyber.gouv.fr/' },
  ],
}
