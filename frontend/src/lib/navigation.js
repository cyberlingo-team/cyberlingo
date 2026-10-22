// Les rubriques de l'appli : dans la barre de gauche sur ordinateur, en bas de l'écran sur
// téléphone. « Mon Tux » montre le Tux du joueur à son stade.

export const NAV_ITEMS = [
  { to: '/apprendre', label: 'Apprendre', icon: 'igloo', routes: ['learn', 'guide'] },
  { to: '/classement', label: 'Classement', icon: 'podium', routes: ['leaderboard'] },
  { to: '/quetes', label: 'Quêtes', icon: 'coffre', routes: ['quests'] },
  { to: '/boutique', label: 'Boutique', icon: 'etal', routes: ['shop'] },
  { to: '/mon-tux', label: 'Mon Tux', icon: 'tux', routes: ['profile'] },
]

// Le menu « Plus » de la barre de gauche.
export const MORE_ITEMS = [
  { to: '/preferences', label: 'Préférences', routes: ['preferences'] },
  { to: '/mon-compte', label: 'Mon compte', routes: ['account'], account: true },
  { to: '/aide', label: 'Aide', routes: ['help'] },
  { to: '/credits', label: 'Crédits', routes: ['credits'] },
]

export function isActive(item, route) {
  return item.routes.includes(route.name)
}

// Après connexion, on renvoie le joueur là où il était, mais seulement vers une page du site.
export function safeRedirect(target, fallback = '/apprendre') {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : fallback
}
