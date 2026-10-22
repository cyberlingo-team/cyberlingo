// Le parcours : les missions rangées par thème, dans l'ordre où on les apprend. Comme
// missions/, ce sont des données que le futur serveur pourra reprendre telles quelles.
//
// Un thème :
//   id, title, description
//   color     couleur du thème dans l'interface (nom de la palette, voir styles/app.css)
//   villain   déguisement de Léopold qui rôde le long du thème (image de l'interface)
//   missions  identifiants des missions, dans l'ordre du chemin
//
// Le chemin d'un thème : les deux premières leçons, un coffre, les leçons suivantes, puis le
// bilan du thème (une question tirée de chaque leçon).

export const UNITS = [
  {
    id: 'hameconnage',
    title: 'L’hameçonnage',
    description: 'Repérer les faux mails et les faux SMS avant de cliquer.',
    color: 'toque',
    villain: 'fisher',
    missions: ['adresse-piegee', 'colis-fantome', 'piece-jointe', 'abonnement-suspendu', 'amende-express'],
  },
  {
    id: 'mots-de-passe',
    title: 'Les mots de passe',
    description: 'Des mots de passe solides, un par compte, et un deuxième verrou.',
    color: 'bec',
    villain: 'techie',
    missions: ['phrase-de-passe', 'meme-mot-de-passe', 'carnet-de-disquette', 'deuxieme-verrou', 'code-0000'],
  },
  {
    id: 'telephone',
    title: 'Les arnaques au téléphone',
    description: 'Faux conseillers, faux proches, fausses alertes : raccrocher et rappeler soi-même.',
    color: 'mer',
    villain: 'banker',
    missions: ['faux-conseiller', 'coucou-papa', 'code-sms-ami', 'ecran-qui-hurle', 'fraude-au-president'],
  },
  {
    id: 'arnaques',
    title: 'Les arnaques en ligne',
    description: 'Fausses boutiques, faux acheteurs, QR codes collés et chantage.',
    color: 'corail',
    villain: 'seller',
    missions: ['boutique-trop-belle', 'faux-acheteur', 'qr-code-colle', 'arnaque-sentiments', 'chantage-webcam'],
  },
  {
    id: 'appareils',
    title: 'Tes appareils et tes données',
    description: 'Mises à jour, sauvegardes, permissions et données personnelles.',
    color: 'algue',
    villain: 'leopold',
    missions: ['plus-tard', 'disque-qui-claque', 'lampe-curieuse', 'cookies-et-droits', 'messages-secrets'],
  },
  {
    id: 'reseaux',
    title: 'Le Wi-Fi et les objets connectés',
    description: 'Le Wi-Fi du café, la box du salon, la caméra et la clé USB trouvée.',
    color: 'glace',
    villain: 'waiter',
    missions: ['wifi-gratuit', 'box-du-salon', 'camera-bavarde', 'cle-usb'],
  },
]

// Le coffre de chaque thème se trouve après cette leçon (la deuxième).
export const CHEST_AFTER = 2
