// Les quatre rubriques du site : en haut sur ordinateur, en bas de l'écran sur téléphone.

export const NAV_ITEMS = [
  { to: '/', label: 'Aujourd’hui', icon: 'today', routes: ['today'] },
  { to: '/episodes', label: 'Épisodes', icon: 'episodes', routes: ['episodes', 'episode'] },
  { to: '/classement', label: 'Classement', icon: 'leaderboard', routes: ['leaderboard'] },
  { to: '/mon-tux', label: 'Mon Tux', icon: 'profile', routes: ['profile'] },
]

export function isActive(item, route) {
  return item.routes.includes(route.name)
}

// Après connexion, on renvoie le joueur là où il était, mais seulement vers une page du site.
export function safeRedirect(target, fallback = '/') {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : fallback
}
