export default {
  id: 'wifi-gratuit',
  title: 'Un café, deux Wi-Fi',
  theme: 'Wi-Fi public',
  guest: 'styrian-hat',
  villain: 'waiter',
  hook: 'Tyrol fait escale au Café des Mouettes. Deux réseaux Wi-Fi portent presque le même nom.',
  questions: [
    {
      id: 'reseau',
      kind: 'trap',
      scene: '15 h 40. Tyrol pose son sac au Café des Mouettes. Sur l’ardoise du comptoir : « Wi-Fi : CafeDesMouettes, code sur demande ».',
      line: 'Tiens, il y en a un sans code, et il capte mieux ! Je prends celui-là ?',
      artifact: {
        kind: 'wifi',
        place: 'Café des Mouettes',
        networks: [
          { name: '{{faux|CafeDesMouettes-WiFi-Gratuit}}', locked: false, signal: 3 },
          { name: '{{vrai|CafeDesMouettes}}', locked: true, signal: 2 },
          { name: '{{voisin|KrillBox-58A2}}', locked: true, signal: 1 },
        ],
      },
      prompt: 'Le réseau « CafeDesMouettes-WiFi-Gratuit », piège ou pas ?',
      answer: 'trap',
      explanation:
        'Le café annonce un seul réseau, « CafeDesMouettes », protégé par un code. L’autre copie son nom, mais ne vient pas du café : il est très facile de créer un Wi-Fi au nom d’un commerce pour espionner ceux qui s’y connectent. Avant de te connecter, demande le nom exact du réseau au comptoir.',
      notes: [
        { zone: 'faux', text: 'Un nom presque identique, sans code : ce n’est pas le réseau annoncé par le café.' },
        { zone: 'vrai', text: 'Le nom écrit sur l’ardoise, avec un code donné au comptoir.' },
        { zone: 'voisin', text: 'La box d’un voisin : rien à voir avec le café.' },
      ],
      success: 0.81,
    },
    {
      id: 'portail',
      kind: 'trap',
      scene: '15 h 42. Tyrol a quand même choisi le réseau gratuit. Une page s’ouvre avant de le laisser naviguer.',
      line: 'Ils veulent juste que je me connecte. C’est normal pour un Wi-Fi, non ?',
      artifact: {
        kind: 'browser',
        url: '{{adresse|wifi-gratuit-connexion.info/acces}}',
        title: 'Wi-Fi gratuit : connexion',
        body: ['Pour accéder à Internet, identifiez-vous avec votre compte de messagerie.'],
        fields: ['{{mail|Adresse e-mail}}', '{{mdp|Mot de passe de votre messagerie}}'],
        cta: 'Se connecter et naviguer',
      },
      prompt: 'Cette page de connexion, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Aucun Wi-Fi n’a besoin du mot de passe de ta messagerie. Avec lui, un escroc lit tes mails et peut cliquer sur « mot de passe oublié » pour prendre tes autres comptes. Même face à un vrai portail Wi-Fi, la CNIL conseille de donner le moins d’informations possible, et pas ton adresse mail principale.',
      notes: [
        { zone: 'adresse', text: 'Une adresse qui n’a rien à voir avec le café.' },
        { zone: 'mdp', text: 'Le mot de passe de ta messagerie : la clé de tous tes autres comptes.' },
      ],
      success: 0.74,
    },
    {
      id: 'payer',
      kind: 'choice',
      scene: '15 h 50. Tyrol a quitté le réseau gratuit et demandé le code au comptoir. Reste à payer son auberge pour ce soir.',
      line: 'Je sors la carte bancaire… Mais je passe par quel réseau ?',
      prompt: 'Comment payer le plus prudemment ?',
      options: [
        { id: 'code', text: 'Sur le vrai Wi-Fi du café, puisqu’il est protégé par un code.' },
        { id: 'mobile', text: 'Avec le réseau mobile de son téléphone, 4G ou 5G, Wi-Fi coupé.' },
        { id: 'cadenas', text: 'Sur le Wi-Fi gratuit, si le site de l’auberge affiche un cadenas.' },
        { id: 'vite', text: 'Sur n’importe quel réseau, à condition de taper très vite.' },
      ],
      answer: 'mobile',
      explanation:
        'Un Wi-Fi public reste public, même avec un code connu de tous les clients, et le cadenas d’un site ne suffit pas à le rendre sûr. On n’y fait pas d’opération sensible, comme un paiement par carte. Mieux vaut le réseau mobile de ton abonnement ; et pour un ordinateur, le partage de connexion de ton téléphone, protégé par un mot de passe robuste.',
      success: 0.66,
    },
    {
      id: 'vpn',
      kind: 'truefalse',
      scene: '16 h 10. Paiement fait en 4G. Tyrol, lui, rêve déjà de sa prochaine escale.',
      line: 'La prochaine fois, j’installe un VPN gratuit, et je paie sur le Wi-Fi du café !',
      prompt: 'Avec un VPN, un Wi-Fi public devient assez sûr pour y payer par carte.',
      answer: false,
      explanation:
        'Le VPN est une précaution en plus, pas un laissez-passer. Cybermalveillance.gouv.fr est clair : sur un Wi-Fi public, on ne fait jamais d’opération sensible, et on utilise un VPN « si possible ». Et si tu en prends un, la CNIL conseille un VPN de préférence payant, ou que tu as installé toi-même chez toi.',
      success: 0.48,
    },
    {
      id: 'auto',
      kind: 'truefalse',
      scene: '17 h 30. Tyrol reprend la route. Dans les réglages de son téléphone, le réseau gratuit du café est resté enregistré.',
      line: 'Comme ça, la prochaine fois, il se connecte tout seul. Pratique !',
      artifact: {
        kind: 'app',
        app: 'Réglages',
        title: 'CafeDesMouettes-WiFi-Gratuit',
        body: ['{{ouvert|Réseau ouvert, sans mot de passe}}', '{{auto|Rejoindre automatiquement : activé}}', '{{derniere|Dernière connexion : aujourd’hui, 15 h 42}}'],
        buttons: ['Oublier ce réseau', 'OK'],
      },
      prompt: 'Mieux vaut désactiver « Rejoindre automatiquement » pour ce réseau.',
      answer: true,
      explanation:
        'Avec la connexion automatique, le téléphone se reconnecte tout seul dès que Tyrol repasse à portée, sans lui demander son avis. La CNIL conseille de la réserver aux réseaux de la maison et du bureau. Ici, le mieux est même d’oublier ce réseau, et de couper le Wi-Fi quand il ne sert pas.',
      notes: [
        { zone: 'auto', text: 'Activé : le téléphone s’y reconnectera sans rien demander.' },
        { zone: 'ouvert', text: 'Sans mot de passe : n’importe qui peut s’y connecter.' },
      ],
      success: 0.72,
    },
  ],
  moral:
    'Au café, demande au comptoir le nom exact du Wi-Fi. Pour payer ou faire une démarche sensible, passe par le réseau mobile de ton téléphone ou son partage de connexion. Et pas de connexion automatique aux Wi-Fi publics.',
  sources: [
    { label: 'CNIL : utiliser un Wi-Fi public, 4 précautions à prendre', url: 'https://www.cnil.fr/fr/utiliser-un-wi-fi-public-voici-4-precautions-prendre' },
    { label: 'ANSSI : les 10 règles d’or de la sécurité numérique', url: 'https://cyber.gouv.fr/securisation/10-regles-or-securite-numerique/' },
    { label: 'Cybermalveillance.gouv.fr : 10 mesures essentielles', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/10-mesures-essentielles-assurer-securite-numerique' },
  ],
}
