export default {
  id: 'deuxieme-verrou',
  title: 'Le deuxième verrou',
  theme: 'Double authentification',
  guest: 'classic',
  villain: null,
  hook: 'Tonton découvre la double authentification. Il compte bien l’expliquer à toute la famille.',
  questions: [
    {
      id: 'activer',
      kind: 'choice',
      scene: '10 h 00. Tonton fouille les réglages de sa messagerie. Une option l’intrigue.',
      line: 'Un deuxième verrou ? J’ai déjà un mot de passe, moi !',
      artifact: {
        kind: 'app',
        app: 'Banquise Mail',
        title: 'Double authentification',
        body: [
          'En plus de votre mot de passe, {{code|un code envoyé sur votre téléphone}} vous sera demandé {{quand|à chaque connexion depuis un nouvel appareil}}.',
        ],
        buttons: ['Plus tard', 'Activer'],
      },
      prompt: 'À quoi sert ce deuxième verrou ?',
      options: [
        { id: 'voleur', text: 'À bloquer quelqu’un qui aurait volé son mot de passe.' },
        { id: 'oubli', text: 'À se connecter sans mot de passe quand on l’a oublié.' },
        { id: 'virus', text: 'À protéger son téléphone contre les virus.' },
        { id: 'pub', text: 'À recevoir moins de publicités dans sa boîte mail.' },
      ],
      answer: 'voleur',
      explanation:
        'Avec la double authentification, le mot de passe ne suffit plus : il faut aussi une confirmation que lui seul peut donner, ici un code reçu sur son téléphone. Un voleur qui n’a que son mot de passe ne peut pas entrer, et un code reçu sans l’avoir demandé alerte Tonton.',
      notes: [
        { zone: 'code', text: 'Le deuxième verrou : un objet que Tonton est seul à avoir, son téléphone.' },
        { zone: 'quand', text: 'Un appareil inconnu devra montrer patte blanche.' },
      ],
      success: 0.86,
    },
    {
      id: 'code-recu',
      kind: 'trap',
      scene: '10 h 05. Activé ! Tonton se connecte depuis sa nouvelle tablette. Aussitôt, son téléphone vibre.',
      line: 'Un SMS avec un code ? Ça sent l’arnaque, ça !',
      artifact: {
        kind: 'sms',
        sender: '{{expediteur|Banquise Mail}}',
        time: '10:05',
        body: 'Votre code de connexion : {{code|482 913}}. {{secret|Ne le communiquez à personne}}, même à nos services. Valable 10 minutes.',
      },
      prompt: 'Ce SMS, piège ou pas ?',
      answer: 'safe',
      explanation:
        'Tonton vient lui-même de se connecter : ce code est la suite logique de ce qu’il est en train de faire. Le SMS ne contient aucun lien et ne demande rien, sauf de garder le code pour soi. Il le tape sur la tablette où il se connecte, et nulle part ailleurs.',
      notes: [
        { zone: 'expediteur', text: 'Un nom d’expéditeur peut être imité : ce qui rassure, c’est que Tonton vient de se connecter.' },
        { zone: 'code', text: 'À taper uniquement là où il se connecte lui-même.' },
        { zone: 'secret', text: 'Un vrai service le rappelle : ce code ne se donne à personne.' },
      ],
      success: 0.62,
    },
    {
      id: 'conseiller',
      kind: 'truefalse',
      scene: '10 h 08. Réflexe de Tonton : transférer le SMS au groupe « Famille », pour montrer. Puis une question le chiffonne.',
      line: 'Et si un conseiller m’appelle pour me demander ce code, je le lui donne ?',
      prompt: 'Un vrai conseiller peut te demander ce code par téléphone.',
      answer: false,
      explanation:
        'Jamais. Ce code prouve que c’est bien toi qui te connectes : celui qui l’obtient peut entrer à ta place. Ni ta banque, ni ta messagerie, ni aucun service sérieux ne te le demandera : au moindre doute, raccroche et contacte toi-même le service. Et ce code ne se transfère pas non plus à la famille !',
      success: 0.8,
    },
    {
      id: 'demande',
      kind: 'trap',
      scene: '21 h 40. Tonton regarde un film, sa tablette éteinte. Soudain, une alerte s’affiche sur son téléphone.',
      line: 'Quelqu’un veut se connecter ? Bah, j’autorise, ça doit être moi.',
      artifact: {
        kind: 'app',
        app: 'Banquise Mail',
        title: 'Demande de connexion',
        body: [
          'Quelqu’un essaie de se connecter à votre compte avec {{mdp|le bon mot de passe}}.',
          'Appareil : {{appareil|ordinateur inconnu}}',
          'Est-ce bien vous ?',
        ],
        buttons: ['Refuser', 'Autoriser'],
      },
      prompt: 'Cette demande de connexion, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Tonton n’essaie pas de se connecter : la demande vient de quelqu’un d’autre, qui connaît son mot de passe. Il refuse, puis change tout de suite son mot de passe. L’alerte, elle, est bien réelle : le deuxième verrou vient de faire son travail.',
      notes: [
        { zone: 'mdp', text: 'Son mot de passe est connu de quelqu’un d’autre : à changer tout de suite.' },
        { zone: 'appareil', text: 'Un appareil inconnu, alors que Tonton ne se connecte pas.' },
      ],
      success: 0.78,
    },
    {
      id: 'sms-utile',
      kind: 'truefalse',
      scene: '21 h 50. Tonton raconte tout à la bande. Alu, qui se méfie de tout, affirme que les codes par SMS « se piratent ».',
      line: 'Alu dit que ça ne sert à rien. Je désactive tout ?',
      prompt: 'Même reçu par SMS, ce code protège mieux qu’un mot de passe seul.',
      answer: true,
      explanation:
        'Alu n’a pas tout à fait tort : le SMS n’est pas le second facteur le plus solide, car une ligne peut être détournée et un faux site peut réclamer le code en direct. Mais selon la CNIL, il reste plus sûr qu’un mot de passe seul. Si le service propose une appli d’authentification ou une clé de sécurité, c’est encore mieux.',
      success: 0.66,
    },
  ],
  moral:
    'Active la double authentification partout où c’est possible. Un code que tu n’as pas demandé, une connexion que tu n’as pas lancée ? Refuse, et change ton mot de passe. Et ce code, ne le donne jamais à personne.',
  sources: [
    { label: 'Cybermalveillance.gouv.fr : la double authentification', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/double-authentification' },
    { label: 'CNIL : recommandation sur l’authentification multifacteur', url: 'https://www.cnil.fr/sites/cnil/files/2025-03/recommandation_relative_a_l_authentification_multifacteur.pdf' },
    { label: 'Cybermalveillance.gouv.fr : la fraude au faux conseiller bancaire', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/fraude-faux-conseiller-bancaire' },
  ],
}
