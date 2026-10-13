export default {
  id: 'faux-acheteur',
  title: 'Les skis de Tyrol',
  theme: 'Faux acheteur',
  guest: 'styrian-hat',
  villain: 'courier',
  hook: 'Tyrol vend ses vieux skis sur Troc-Banquise. Un acheteur se manifeste en moins de cinq minutes.',
  questions: [
    {
      id: 'acheteur',
      kind: 'trap',
      scene: '10 h 05. Tyrol a mis ses skis de randonnée en vente sur Troc-Banquise, un site de petites annonces. Un premier message arrive.',
      line: 'Déjà un acheteur ! Ces skis vont financer mon prochain voyage.',
      artifact: {
        kind: 'chat',
        contact: 'Neige_et_Soleil',
        messages: [
          { from: 'them', text: 'Bonjour ! Vos skis m’intéressent, je les prends au prix affiché.', time: '10:04' },
          { from: 'them', text: 'Je suis en déplacement : {{livreur|je paie via Glissade Livraison, leur livreur passe prendre les skis}}.', time: '10:04' },
          { from: 'them', text: '{{ailleurs|Donnez-moi votre numéro, on continuera sur messagerie.}}', time: '10:05' },
        ],
      },
      prompt: 'Cet acheteur, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Un paiement « par le livreur » et l’envie de quitter vite la plateforme : deux signaux d’alerte classiques. Les sociétés de livraison ne gèrent pas l’argent des ventes entre particuliers. Et Cybermalveillance.gouv.fr conseille de se méfier des invitations trop rapides à poursuivre les échanges ailleurs.',
      notes: [
        { zone: 'livreur', text: 'Un livreur transporte des colis, pas l’argent des ventes.' },
        { zone: 'ailleurs', text: 'Quitter vite la plateforme : un signal d’alerte.' },
      ],
      success: 0.74,
    },
    {
      id: 'lien',
      kind: 'clues',
      scene: '10 h 20. Tyrol a quand même donné son numéro. Un SMS arrive, avec un lien « pour recevoir le paiement ». Il l’ouvre.',
      line: 'Une page rien que pour me payer ? Ils sont bien organisés, chez Glissade.',
      artifact: {
        kind: 'browser',
        url: '{{adresse|glissade-livraison-paiement.top/recevoir}}',
        title: 'Recevoir votre paiement',
        body: [
          'Bonne nouvelle : {{montant|320 €}} vous attendent.',
          '{{annonce|Annonce n° 48213 : skis de randonnée}}',
          'Pour recevoir les fonds, {{verif|confirmez votre carte bancaire}}.',
        ],
        fields: ['Numéro de carte', 'Date d’expiration', '{{crypto|Cryptogramme}}', '{{code|Code reçu par SMS}}'],
        cta: 'Recevoir 320 €',
      },
      prompt: 'Trouve 3 éléments qui trahissent le piège.',
      answer: ['adresse', 'verif', 'crypto', 'code'],
      pick: 3,
      explanation:
        'Pour recevoir de l’argent, on n’a jamais à donner son cryptogramme ni un code reçu par SMS : ce code sert à valider une opération, et Tyrol paierait l’escroc au lieu d’être payé. Ce lien, envoyé par l’acheteur, ne mène d’ailleurs pas sur Troc-Banquise. Le prix et le numéro d’annonce, eux, sont exacts : l’escroc les a simplement recopiés.',
      notes: [
        { zone: 'adresse', text: 'Un lien envoyé par l’acheteur, qui ne mène pas sur Troc-Banquise.' },
        { zone: 'verif', text: 'Le prétexte classique pour voler une carte bancaire.' },
        { zone: 'crypto', text: 'Le cryptogramme sert à payer, jamais à recevoir.' },
        { zone: 'code', text: 'Ce code valide une opération : il ne se donne jamais.' },
        { zone: 'montant', text: 'Le prix de l’annonce : rien d’anormal en soi.' },
        { zone: 'annonce', text: 'Le vrai numéro d’annonce, recopié pour mettre en confiance.' },
      ],
      success: 0.58,
    },
    {
      id: 'livraison',
      kind: 'truefalse',
      scene: '10 h 25. Tyrol hésite. L’acheteur insiste : « C’est la procédure de Glissade Livraison, tout le monde fait comme ça ! »',
      line: 'Il a l’air si sûr de lui… C’est peut-être normal, au fond ?',
      prompt: 'Un paiement « par la société de livraison », c’est toujours une arnaque.',
      answer: true,
      explanation:
        'Cybermalveillance.gouv.fr est formel : une proposition de payer une vente directement à une entreprise de livraison, c’est toujours une escroquerie, car ces sociétés ne proposent pas de services de transactions financières. Le livreur transporte le colis, pas l’argent.',
      success: 0.6,
    },
    {
      id: 'second',
      kind: 'trap',
      scene: '14 h. Tyrol n’a rien saisi sur la page. Sur la messagerie de Troc-Banquise, un second acheteur se présente.',
      line: 'Encore un acheteur. Cette fois, je lis tout avant de répondre.',
      artifact: {
        kind: 'chat',
        contact: 'Morse_du_Port',
        messages: [
          { from: 'them', text: 'Bonjour ! {{taille|Ils font quelle longueur, vos skis ?}}', time: '13:58' },
          { from: 'me', text: '1,70 m, fixations comprises.', time: '14:00' },
          { from: 'them', text: 'Parfait. {{rdv|Je peux passer samedi matin, devant la gare, et payer sur place.}}', time: '14:01' },
          { from: 'them', text: '{{plateforme|Ou je paie avec le paiement de Troc-Banquise, comme vous préférez.}}', time: '14:01' },
        ],
      },
      prompt: 'Ce second acheteur, piège ou pas ?',
      answer: 'safe',
      explanation:
        'Rien de suspect : pas de lien, pas de code, pas d’urgence, et l’acheteur reste sur la messagerie de la plateforme. Il propose une remise en main propre dans un lieu public ou le paiement de Troc-Banquise, deux solutions que conseille Cybermalveillance.gouv.fr. S’il paie en ligne, Tyrol vérifiera le paiement dans son espace Troc-Banquise, pas dans un message.',
      notes: [
        { zone: 'taille', text: 'Une vraie question sur l’objet : bon signe.' },
        { zone: 'rdv', text: 'En main propre, dans un lieu public fréquenté : c’est conseillé.' },
        { zone: 'plateforme', text: 'Le paiement de la plateforme : la solution recommandée.' },
      ],
      success: 0.6,
    },
    {
      id: 'relance',
      kind: 'choice',
      scene: '14 h 30. Le premier acheteur relance par SMS : « Un conseiller de Glissade Livraison va vous appeler pour débloquer les fonds. »',
      line: 'Un conseiller ? Il pourrait m’aider à toucher mon argent…',
      prompt: 'Que doit faire Tyrol avec le premier acheteur ?',
      options: [
        { id: 'appel', text: 'Attendre l’appel du conseiller, qui l’aidera à valider le paiement.' },
        { id: 'lien', text: 'Lui demander un autre lien, sur un site qui a l’air plus sérieux.' },
        { id: 'fausse', text: 'Remplir son formulaire avec une fausse carte, pour le faire tourner en bourrique.' },
        { id: 'signaler', text: 'Ne plus lui répondre et signaler son profil à Troc-Banquise.' },
      ],
      answer: 'signaler',
      explanation:
        'Le « conseiller » serait un complice : ce scénario revient souvent dans les arnaques entre particuliers. Tyrol coupe le contact et signale le profil à la plateforme, sans jouer avec l’escroc. Et s’il avait saisi sa carte, il devrait faire opposition tout de suite auprès de sa banque.',
      success: 0.7,
    },
  ],
  moral:
    'Pour recevoir de l’argent, tu n’as jamais à donner ton cryptogramme ni un code reçu par SMS. Reste sur la plateforme, utilise son paiement ou la remise en main propre, et refuse tout paiement « par le livreur ».',
  sources: [
    { label: 'Cybermalveillance.gouv.fr : vente entre particuliers, 20 conseils', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/conseils-sites-vente-particuliers' },
    { label: 'Cybermalveillance.gouv.fr : fraude à la carte bancaire, que faire ?', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/fraude-carte-bancaire' },
    { label: 'Cybermalveillance.gouv.fr : le piratage de comptes en ligne en 2025', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/donnees-perso-piratage-compte-ra25' },
  ],
}
