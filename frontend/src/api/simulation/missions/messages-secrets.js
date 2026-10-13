export default {
  id: 'messages-secrets',
  title: 'Les secrets de famille',
  theme: 'Messages et chiffrement',
  guest: 'classic',
  villain: null,
  hook: 'Le groupe « Famille » de Tonton déborde : photos, recettes… et quelques secrets de trop.',
  questions: [
    {
      id: 'groupe',
      kind: 'clues',
      scene: '18 h 00. Tonton organise le repas de dimanche dans le groupe SMS « Famille ». Il partage tout. Vraiment tout.',
      line: 'Comme ça, tout le monde a les infos. Je pense à tout, moi !',
      artifact: {
        kind: 'chat',
        contact: 'Famille',
        messages: [
          { from: 'them', text: 'On mange à quelle heure, dimanche ? {{heure|12 h 30}} ?', time: '18:01' },
          { from: 'me', text: 'Oui ! Voici {{identite|la photo de ma carte d’identité}}, pour réserver la salle.', time: '18:03' },
          { from: 'me', text: 'Pour monter, {{porte|le code de l’immeuble, c’est 4827B}}.', time: '18:04' },
          { from: 'me', text: 'Et si quelqu’un fait les courses : {{carte|code de ma carte bancaire, 1958}}.', time: '18:05' },
          { from: 'them', text: 'Parfait, j’apporte {{dessert|une tarte aux pommes}} !', time: '18:07' },
        ],
      },
      prompt: 'Touche les 3 messages qui n’avaient rien à faire dans ce groupe.',
      pick: 3,
      answer: ['identite', 'porte', 'carte'],
      explanation:
        'Le code de la carte bancaire ne se donne à personne, même en famille. Le code de l’immeuble et la photo de la carte d’identité, eux, restent stockés dans les téléphones de tout le groupe, et une copie de pièce d’identité peut servir à usurper une identité. Si elle est vraiment nécessaire, on l’envoie à la seule personne concernée, marquée du motif, de la date et du destinataire.',
      notes: [
        { zone: 'identite', text: 'Une copie de pièce d’identité peut servir à usurper son identité.' },
        { zone: 'porte', text: 'Ce code se retrouve dans tous les téléphones du groupe.' },
        { zone: 'carte', text: 'Le code de la carte ne se donne jamais, même en famille.' },
        { zone: 'heure', text: 'L’heure du repas, on peut la crier sur les toits.' },
        { zone: 'dessert', text: 'Aucun risque… sauf pour la ligne.' },
      ],
      success: 0.8,
    },
    {
      id: 'canal',
      kind: 'choice',
      scene: '18 h 30. Tonton a compris la leçon. Mais un jour, il devra bien envoyer une info sensible à quelqu’un.',
      line: 'Alors je passe par où ? Par pigeon voyageur ?',
      prompt: 'Pour une info sensible, que conseille l’ANSSI ?',
      options: [
        { id: 'sms', text: 'Le SMS, puisqu’il passe par l’opérateur téléphonique.' },
        { id: 'chiffre', text: 'Une messagerie chiffrée de bout en bout.' },
        { id: 'majuscules', text: 'N’importe quel moyen, avec « CONFIDENTIEL » écrit en majuscules.' },
        { id: 'publication', text: 'Une publication sur un réseau social, en mode privé.' },
      ],
      answer: 'chiffre',
      explanation:
        'L’ANSSI conseille d’éviter les SMS pour les informations sensibles et de préférer une messagerie chiffrée de bout en bout. Écrire « CONFIDENTIEL » ne protège rien du tout. Et certains secrets, comme le code de la carte, ne s’envoient jamais, quel que soit le moyen.',
      success: 0.74,
    },
    {
      id: 'bout-en-bout',
      kind: 'truefalse',
      scene: '18 h 40. Tonton installe une messagerie chiffrée de bout en bout. Il se demande ce que ça change vraiment.',
      line: 'De bout en bout… mais de quel bout à quel bout ?',
      prompt: 'Chiffré de bout en bout, un message n’est lisible que par les gens de la conversation.',
      answer: true,
      explanation:
        'C’est la définition qu’en donne la CNIL : les messages sont chiffrés de façon que seules les personnes de la conversation puissent les déchiffrer. Le service qui les transporte ne voit passer qu’un charabia illisible. Pour la CNIL, c’est la solution la plus protectrice de la vie privée.',
      success: 0.72,
    },
    {
      id: 'espion',
      kind: 'truefalse',
      scene: '18 h 50. Tonton se croit invincible. Il veut même installer « Blagues à Gogo », une appli gratuite reçue par SMS.',
      line: 'Mes messages sont chiffrés ! Plus rien ne peut m’arriver.',
      prompt: 'Chiffrés de bout en bout, ses messages restent secrets même si son téléphone est piraté.',
      answer: false,
      explanation:
        'Le chiffrement protège les messages pendant le trajet. Mais pour que Tonton puisse les lire, ils sont déchiffrés sur son téléphone : un logiciel espion installé dessus peut alors tout voir. Il faut donc protéger le téléphone lui-même : code, mises à jour, et applis venues uniquement des magasins officiels.',
      success: 0.6,
    },
    {
      id: 'chiffrer',
      kind: 'choice',
      scene: '19 h 00. Dernière étape : le prof montre à Tonton un réglage de son vieux téléphone, resté désactivé depuis l’achat.',
      line: 'Encore du chiffrement ? Mais je viens d’en installer !',
      artifact: {
        kind: 'app',
        app: 'Réglages',
        title: 'Chiffrement de l’appareil',
        body: ['Téléphone : {{telephone|non chiffré}}', 'Carte mémoire : {{memoire|non chiffrée}}'],
        buttons: ['Plus tard', 'Chiffrer'],
      },
      prompt: 'À quoi sert ce réglage ?',
      options: [
        { id: 'vol', text: 'À protéger ses données si on lui vole son téléphone.' },
        { id: 'messages', text: 'À rendre automatiquement tous ses SMS chiffrés de bout en bout.' },
        { id: 'espion', text: 'À bloquer tous les logiciels espions, même ceux déjà installés.' },
        { id: 'batterie', text: 'À faire durer la batterie plus longtemps.' },
      ],
      answer: 'vol',
      explanation:
        'Si le téléphone est perdu ou volé, le chiffrement empêche de contourner le code pour lire les données. Il ne transforme pas les SMS en messages chiffrés de bout en bout, et ne bloque pas un logiciel espion qui tourne sur le téléphone allumé. Les appareils récents le proposent dans leurs réglages, et la carte mémoire se chiffre aussi.',
      notes: [
        { zone: 'telephone', text: 'À activer : sans le code, impossible de lire les données.' },
        { zone: 'memoire', text: 'La carte mémoire aussi se chiffre.' },
      ],
      success: 0.7,
    },
  ],
  moral:
    'Un code de carte ou un mot de passe ne s’envoie jamais, même en famille. Pour une info sensible, évite le SMS et préfère une messagerie chiffrée de bout en bout. Et protège ton téléphone : code, chiffrement, mises à jour.',
  sources: [
    { label: 'ANSSI : hygiène numérique des téléphones mobiles', url: 'https://messervices.cyber.gouv.fr/guides/hygiene-numerique-des-telephones-mobiles' },
    { label: 'CNIL : les pratiques de chiffrement', url: 'https://www.cnil.fr/fr/les-pratiques-de-chiffrement-dans-linformatique-en-nuage-cloud-public' },
    { label: 'Cybermalveillance.gouv.fr : sécuriser ses appareils mobiles', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/appareils-mobiles' },
  ],
}
