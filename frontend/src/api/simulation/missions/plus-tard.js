export default {
  id: 'plus-tard',
  title: 'Mise à jour ? Plus tard !',
  theme: 'Mises à jour',
  guest: 'hard-hat',
  villain: null,
  hook: 'Chantier clique toujours sur « Plus tard ». Aujourd’hui, son ordinateur insiste.',
  questions: [
    {
      id: 'a-quoi-bon',
      kind: 'truefalse',
      scene: '8 h 30. Chantier allume son ordinateur. Une mise à jour lui est proposée, pour la quatorzième fois.',
      line: 'Plus tard ! Il marche très bien comme ça, pourquoi changer ?',
      prompt: 'Les mises à jour servent aussi à corriger des failles de sécurité.',
      answer: true,
      explanation:
        'Les éditeurs et les fabricants publient des mises à jour pour corriger les failles de leurs logiciels et appareils. Sans elles, des pirates peuvent se servir de ces failles pour entrer dans l’ordinateur, voler des données ou espionner. « Il marche très bien » ne veut pas dire « il est protégé ».',
      success: 0.88,
    },
    {
      id: 'reglages',
      kind: 'trap',
      scene: '8 h 32. Pour en avoir le cœur net, Chantier ouvre lui-même les Réglages de son ordinateur.',
      line: 'Elle est là aussi ? C’est peut-être une arnaque, cette mise à jour…',
      artifact: {
        kind: 'app',
        app: 'Réglages',
        title: 'Mise à jour du système',
        body: [
          '{{version|La version 14.2.1 du système est disponible.}}',
          '{{correctifs|Contient des correctifs de sécurité importants.}}',
          '{{duree|L’ordinateur redémarrera pendant l’installation.}}',
        ],
        buttons: ['Plus tard', 'Installer cette nuit'],
      },
      prompt: 'Cette mise à jour, piège ou pas ?',
      answer: 'safe',
      explanation:
        'On peut s’y fier : elle apparaît dans les Réglages que Chantier a ouverts lui-même, sans lien à cliquer ni paiement. C’est le système qui la propose, et elle corrige des failles : à installer sans tarder. Le bouton « Installer cette nuit » permet même de le faire pendant qu’il dort.',
      notes: [
        { zone: 'version', text: 'Proposée par le système, dans ses propres Réglages : le bon canal.' },
        { zone: 'correctifs', text: 'Des failles corrigées : raison suffisante pour ne plus attendre.' },
      ],
      success: 0.63,
    },
    {
      id: 'pas-le-temps',
      kind: 'choice',
      scene: '8 h 40. Chantier soupire : les mises à jour tombent toujours au mauvais moment.',
      line: 'Elles arrivent pile pendant mon match, à chaque fois !',
      prompt: 'Quelle est la meilleure solution ?',
      options: [
        { id: 'desactiver', text: 'Désactiver les mises à jour, pour être enfin tranquille.' },
        { id: 'anniversaire', text: 'Tout installer une fois par an, le jour de son anniversaire.' },
        { id: 'neuf', text: 'Attendre son prochain ordinateur, qui sera forcément à jour.' },
        { id: 'automatique', text: 'Activer l’installation automatique des mises à jour.' },
      ],
      answer: 'automatique',
      explanation:
        'Les désactiver laisserait les failles ouvertes. Avec l’installation automatique, les mises à jour se font sans qu’il ait à y penser ; sinon, il peut les lancer pendant ses temps morts, la nuit ou au déjeuner. Et un appareil neuf n’est pas forcément à jour : on installe ses mises à jour dès le départ.',
      success: 0.72,
    },
    {
      id: 'fenetre',
      kind: 'trap',
      scene: '21 h 00. Chantier regarde un match sur un site de vidéos trouvé au hasard. Une fenêtre surgit.',
      line: 'Mon lecteur n’est pas à jour ? Forcément, avec tous mes « Plus tard »… Je clique ?',
      artifact: {
        kind: 'popup',
        title: 'Mise à jour requise',
        body: [
          '{{blocage|La lecture est bloquée : votre lecteur vidéo n’est plus à jour.}}',
          '{{urgence|Installez la nouvelle version maintenant pour reprendre le match.}}',
          '{{source|Téléchargement rapide depuis lecteur-maj-express.xyz}}',
        ],
        buttons: ['{{bouton|Télécharger la mise à jour}}'],
      },
      prompt: 'Cette mise à jour, piège ou pas ?',
      answer: 'trap',
      explanation:
        'Une vraie mise à jour vient du logiciel lui-même ou du système, pas d’une fenêtre surgie au milieu d’un site. Ces fausses alertes servent à faire installer un virus déguisé en mise à jour. Ferme-la sans cliquer sur ses boutons, et méfie-toi des sites de vidéo douteux : ils peuvent aussi installer un virus.',
      notes: [
        { zone: 'blocage', text: 'Un faux blocage, pour faire peur et faire cliquer.' },
        { zone: 'urgence', text: '« Maintenant » : l’urgence empêche de réfléchir.' },
        { zone: 'source', text: 'Une adresse inconnue, pas le site de l’éditeur du lecteur.' },
        { zone: 'bouton', text: 'Ce bouton télécharge un programme inconnu.' },
      ],
      success: 0.8,
    },
    {
      id: 'ou-la-trouver',
      kind: 'choice',
      scene: '21 h 05. Chantier a fermé la fenêtre. Mais il veut quand même mettre son lecteur vidéo à jour.',
      line: 'D’accord, d’accord… Mais je la trouve où, la vraie mise à jour ?',
      prompt: 'Où Chantier doit-il chercher la mise à jour ?',
      options: [
        { id: 'officiel', text: 'Dans les réglages du lecteur, ou sur le site officiel de son éditeur.' },
        { id: 'forum', text: 'Sur un forum qui offre gratuitement la « version complète », d’habitude payante.' },
        { id: 'pub', text: 'Sur la première publicité qui parle de mise à jour.' },
        { id: 'mail', text: 'Dans un mail inattendu qui l’envoie en pièce jointe.' },
      ],
      answer: 'officiel',
      explanation:
        'Une mise à jour se télécharge uniquement depuis les sources officielles : le logiciel lui-même ou le site de son éditeur. Ce sont elles qui garantissent au mieux une mise à jour sans virus ; une version payante offerte gratuitement est généralement piégée. Pendant l’installation, attention aux cases pré-cochées qui ajoutent d’autres logiciels.',
      success: 0.77,
    },
  ],
  moral:
    'Fini les « Plus tard » : active l’installation automatique, ou lance les mises à jour pendant tes pauses. Et ne prends une mise à jour que dans le logiciel lui-même ou sur le site officiel de son éditeur, jamais dans une fenêtre surgie.',
  sources: [
    { label: 'Cybermalveillance.gouv.fr : les mises à jour', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/mises-a-jour' },
    { label: 'ANSSI : les 10 règles d’or de la sécurité numérique', url: 'https://cyber.gouv.fr/securisation/10-regles-or-securite-numerique/' },
    { label: 'Cybermalveillance.gouv.fr : 10 mesures essentielles', url: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/10-mesures-essentielles-assurer-securite-numerique' },
  ],
}
