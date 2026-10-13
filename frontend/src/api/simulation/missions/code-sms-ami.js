export default {
  id: 'code-sms-ami',
  title: 'Le code envoyé par erreur',
  theme: 'Compte piraté',
  guest: 'remote',
  villain: 'relative',
  hook: 'Un message de Gaucho tombe en plein match. Un petit service à lui rendre, rien de plus.',
  questions: [
    {
      id: 'message',
      kind: 'trap',
      scene: '19 h 04. Zappeur regarde le match sur sa télé connectée. Sur Banquise Tchat, un message de Gaucho arrive.',
      line: 'Un service ? Bien sûr, entre amis, on s’entraide !',
      artifact: {
        kind: 'chat',
        contact: 'Gaucho',
        messages: [
          { from: 'them', text: 'Salut ! {{erreur|Je t’ai envoyé un code par SMS par erreur}}, désolé…', time: '19:03' },
          { from: 'them', text: '{{renvoie|Tu peux me le renvoyer ici ?}} {{urgent|C’est urgent, je suis bloqué.}}', time: '19:03' },
          { from: 'them', text: '{{insiste|Les six chiffres, vite, stp !}}', time: '19:04' },
        ],
      },
      prompt: 'Ce message de Gaucho, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Un code de connexion arrive chez Zappeur parce que quelqu’un essaie d’entrer dans son compte : personne ne peut le lui envoyer « par erreur ». Le compte de Gaucho a sans doute été piraté, et l’escroc écrit sous son nom. On ne transmet rien de confidentiel, même à un proche.',
      notes: [
        { zone: 'erreur', text: '« Par erreur » : le prétexte classique.' },
        { zone: 'renvoie', text: 'Un code reçu par SMS ne se transmet à personne.' },
        { zone: 'urgent', text: 'L’urgence, pour empêcher de réfléchir.' },
        { zone: 'insiste', text: 'Il insiste : encore plus suspect.' },
      ],
      success: 0.77,
    },
    {
      id: 'sms',
      kind: 'trap',
      scene: '19 h 05. Zappeur jette un œil à ses SMS. Le fameux code est bien arrivé, deux minutes plus tôt.',
      line: 'Tiens, le voilà, ce code. Lui aussi, c’est un piège ?',
      artifact: {
        kind: 'sms',
        sender: 'Banquise Tchat',
        time: '19:02',
        body: 'Banquise Tchat : {{code|730 584}} est ton code de connexion. {{conseil|Ne le communique à personne.}} {{appareil|Demande faite depuis un nouvel appareil.}}',
      },
      prompt: 'Ce SMS de Banquise Tchat, piège ou pas ?',
      answer: 'safe',
      explanation:
        'Ce SMS ne demande rien, ni lien ni numéro à rappeler : juste un code et le bon conseil, comme tout message normal de ce genre. Il est sans danger tant que Zappeur garde le code pour lui. Mais il révèle une chose : quelqu’un essaie de se connecter à son compte depuis un nouvel appareil.',
      notes: [
        { zone: 'code', text: 'Le code lui-même : à garder pour soi.' },
        { zone: 'conseil', text: 'Le service le dit lui-même : à ne communiquer à personne.' },
        { zone: 'appareil', text: 'Quelqu’un tente de se connecter depuis un nouvel appareil.' },
      ],
      success: 0.45,
    },
    {
      id: 'pouvoir',
      kind: 'truefalse',
      scene: '19 h 06. Zappeur n’a rien envoyé. Mais il se demande ce qu’un simple code de six chiffres pourrait bien changer.',
      line: 'Six petits chiffres… Qu’est-ce qu’on pourrait en faire ?',
      prompt: 'Avec ce code, le pirate pourrait prendre le contrôle du compte de Zappeur.',
      answer: true,
      explanation:
        'Ce code sert justement à autoriser une connexion depuis un nouvel appareil : celui du pirate. En le donnant, Zappeur lui ouvrirait son compte et ses conversations… et l’escroc pourrait piéger ses contacts à leur tour, en se faisant passer pour lui.',
      success: 0.62,
    },
    {
      id: 'verifier',
      kind: 'choice',
      scene: '19 h 08. « Gaucho » relance : « Alors ? » Zappeur veut savoir qui se cache vraiment derrière ces messages.',
      line: 'Si c’est vraiment Gaucho, je veux l’aider. Mais comment en être sûr ?',
      prompt: 'Comment vérifier que c’est bien Gaucho ?',
      options: [
        { id: 'appeler', text: 'L’appeler sur son numéro habituel, ou passer le voir.' },
        { id: 'question', text: 'Lui poser une question piège dans la conversation.' },
        { id: 'photo', text: 'Vérifier que c’est bien sa photo de profil.' },
        { id: 'moitie', text: 'Envoyer la moitié du code, pour voir sa réaction.' },
      ],
      answer: 'appeler',
      explanation:
        'Si un message semble venir d’un ami, on le contacte par un autre canal, conseille Ma Sécurité : un appel à son numéro habituel, ou de vive voix. Dans la conversation, le pirate a le nom, la photo et tout l’historique de Gaucho : une question piège ne prouve rien.',
      success: 0.72,
    },
    {
      id: 'reprendre',
      kind: 'choice',
      scene: '19 h 15. Zappeur appelle Gaucho, qui tombe des nues : hier, il a cliqué sur un lien et saisi son mot de passe. Il faut réparer.',
      line: 'Gaucho est tout retourné. Qu’est-ce qu’il doit faire, maintenant ?',
      prompt: 'Quel est le bon plan pour Gaucho ?',
      options: [
        { id: 'nouveau', text: 'Créer un nouveau compte, et laisser l’ancien au pirate.' },
        { id: 'attendre', text: 'Ne rien toucher : le pirate finira bien par se lasser.' },
        { id: 'reprendre', text: 'Changer son mot de passe partout et activer la double authentification.' },
        { id: 'publier', text: 'Publier son nouveau mot de passe dans le groupe, pour rassurer ses amis.' },
      ],
      answer: 'reprendre',
      explanation:
        'Gaucho change son mot de passe, partout où il servait, et active la double authentification. La fiche de Cybermalveillance.gouv.fr ajoute d’autres étapes : déconnecter les appareils inconnus, vérifier l’adresse et le numéro de récupération, prévenir ses contacts. Abandonner le compte laisserait le pirate piéger ses amis sous son nom.',
      success: 0.66,
    },
  ],
  moral:
    'Un code reçu par SMS ne se donne à personne, même à un ami : il ouvre ton compte. Si un proche te le demande, appelle-le sur son numéro habituel. Et active la double authentification partout où c’est possible.',
  sources: [
    { label: 'Ma Sécurité : que faire en cas d’hameçonnage ?', url: 'https://www.masecurite.interieur.gouv.fr/fr/fiches-pratiques/numerique/que-faire-en-cas-hameconnage-phishing' },
    { label: 'Cybermalveillance.gouv.fr : piratage de compte, que faire ?', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/piratage-de-compte' },
    { label: 'Cybermalveillance.gouv.fr : la double authentification', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/double-authentification' },
  ],
}
