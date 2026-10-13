export default {
  id: 'cle-usb',
  title: 'La clé du parking',
  theme: 'Clé USB trouvée',
  guest: 'pipe',
  villain: 'techie',
  hook: 'Sur le parking du club, une clé USB attend qu’on la ramasse. L’Inspecteur mène l’enquête.',
  questions: [
    {
      id: 'cle',
      kind: 'trap',
      scene: '7 h 50. Sur le parking du club de randonnée, l’Inspecteur ramasse une clé USB. Une étiquette est collée dessus.',
      line: 'Une enquête ! Je l’ouvre sur mon ordinateur, juste pour retrouver son propriétaire.',
      artifact: {
        kind: 'note',
        style: 'label',
        lines: ['{{titre|COMPTES DU CLUB 2026}}', '{{secret|Confidentiel : ne pas ouvrir}}'],
      },
      prompt: 'Cette clé trouvée, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Une clé trouvée doit être considérée comme piégée, rappelle Cybermalveillance.gouv.fr : même les plus grands spécialistes pourraient avoir du mal à s’en apercevoir. L’étiquette alléchante est là pour donner envie de la brancher. On ne la branche donc jamais, pas même pour retrouver son propriétaire.',
      notes: [
        { zone: 'titre', text: 'Un titre alléchant, pour piquer la curiosité.' },
        { zone: 'secret', text: '« Confidentiel » : rien de tel pour donner envie de regarder.' },
      ],
      success: 0.76,
    },
    {
      id: 'antivirus',
      kind: 'truefalse',
      scene: '7 h 55. Chantier arrive au club, sa tasse à la main : « Pas de panique, mon antivirus vérifiera tout ! »',
      line: 'C’est vrai qu’un antivirus, c’est fait pour ça…',
      prompt: 'Avec un antivirus à jour, on peut brancher la clé sans risque.',
      answer: false,
      explanation:
        'Aucun antivirus ne protège à 100 %. Cybermalveillance.gouv.fr le dit sans détour : une clé trouvée ne se branche jamais, au risque d’ouvrir un accès à un cybercriminel. Et l’ANSSI conseille de ne jamais utiliser un équipement inconnu ou abandonné, comme une clé USB.',
      success: 0.55,
    },
    {
      id: 'appareil',
      kind: 'choice',
      scene: '8 h. L’Inspecteur hésite encore : « Et si je la branchais ailleurs que sur mon ordinateur ? » Toute la bande a un avis.',
      line: 'Il doit bien exister un appareil sans risque…',
      prompt: 'Sur quel appareil peut-on brancher cette clé ?',
      options: [
        { id: 'vieux', text: 'Sur le vieux PC du club, celui qui ne sert plus à grand-chose.' },
        { id: 'aucun', text: 'Sur aucun : une clé trouvée ne se branche nulle part.' },
        { id: 'telephone', text: 'Sur son téléphone, avec un adaptateur : ce n’est pas un ordinateur.' },
        { id: 'tele', text: 'Sur la télé connectée de Zappeur, qui accepte tout.' },
      ],
      answer: 'aucun',
      explanation:
        'Aucun appareil n’est « sans risque » : un vieux PC, un téléphone ou une télé connectée sont aussi des ordinateurs, souvent reliés au même réseau que les autres. Cybermalveillance.gouv.fr conseille de ne jamais brancher une clé trouvée, ni sur ses appareils personnels, ni, encore moins, sur ceux d’une organisation.',
      success: 0.66,
    },
    {
      id: 'boulet',
      kind: 'choice',
      scene: '8 h 30. Trop tard pour Boulet : il avait trouvé une clé jumelle et l’a branchée sur l’ordinateur du club. Une fenêtre s’affiche.',
      line: 'Boulet, qu’as-tu fait ? Vite, il faut limiter les dégâts.',
      artifact: {
        kind: 'popup',
        title: 'Ouverture de COMPTES_2026',
        body: ['{{auto|Installation en cours… 47 %}}', '{{fenetre|Ne fermez pas cette fenêtre.}}'],
        buttons: ['OK'],
      },
      prompt: 'Quel est le bon réflexe, tout de suite ?',
      options: [
        { id: 'banque', text: 'Vérifier son compte bancaire sur cet ordinateur, au cas où.' },
        { id: 'retirer', text: 'Retirer la clé, fermer la fenêtre et continuer comme si de rien n’était.' },
        { id: 'reseau', text: 'Débrancher l’ordinateur d’Internet et du réseau, puis prévenir Rack.' },
        { id: 'aerer', text: 'Ouvrir grand les fenêtres de la salle, pour aérer le virus.' },
      ],
      answer: 'reseau',
      explanation:
        'Déconnecter l’ordinateur d’Internet et du réseau empêche le virus de se propager aux autres appareils. Ensuite, on prévient la personne qui s’occupe de l’informatique : ici, Rack. Et on ne fait plus aucune opération sensible sur cette machine, comme consulter son compte bancaire.',
      notes: [
        { zone: 'auto', text: 'Quelque chose s’installe tout seul : mauvais signe.' },
        { zone: 'fenetre', text: 'Interdit de fermer : encore plus suspect.' },
      ],
      success: 0.58,
    },
    {
      id: 'offerte',
      kind: 'truefalse',
      scene: '18 h. Au salon du randonneur, un stand distribue des clés USB « pleines de cartes de randonnée ». L’Inspecteur fronce les sourcils.',
      line: 'Cadeau ou appât ? Une enquête de plus.',
      prompt: 'Une clé USB offerte mérite la même méfiance qu’une clé trouvée.',
      answer: true,
      explanation:
        'Cybermalveillance.gouv.fr met dans le même sac les clés trouvées et les clés offertes : on part du principe qu’elles sont piégées. L’ANSSI cite aussi le « gadget électronique offert » parmi ce qu’il ne faut pas brancher sur un équipement professionnel. Pour ses fichiers, on utilise ses propres clés, chacune réservée à un usage.',
      success: 0.7,
    },
  ],
  moral:
    'Une clé USB trouvée ou offerte ? Ne la branche jamais, ni pour retrouver son propriétaire, ni « juste pour voir », même avec un antivirus. Si c’est fait, coupe Internet et préviens qui gère l’informatique.',
  sources: [
    { label: 'Cybermalveillance.gouv.fr : séparer ses usages pro-perso (supports USB)', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/securite-usages-pro-perso' },
    { label: 'ANSSI : les 10 règles d’or de la sécurité numérique', url: 'https://cyber.gouv.fr/securisation/10-regles-or-securite-numerique/' },
    { label: 'Cybermalveillance.gouv.fr : virus informatique, que faire ?', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/virus-informatiques' },
  ],
}
