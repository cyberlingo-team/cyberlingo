// Branche l'interface sur le serveur simulé, avec une latence de vrai réseau. Pour tourner la
// vidéo ou tester les états difficiles, un paramètre d'adresse change son comportement :
//   ?simulation=panne          le serveur ne répond plus (écrans d'erreur)
//   ?simulation=lent           chaque requête prend deux à trois secondes (écrans de chargement)
//   ?simulation=normal         retour à la normale
//   ?simulation=reinitialiser  efface les comptes créés et les parties jouées dans ce navigateur
// Le mode choisi vaut pour tout l'onglet, jusqu'à ce qu'on en demande un autre.

import { handle } from './server.js'
import { reset } from './store.js'

const MODE_KEY = 'cyberlingo.simulation.mode'
const MODES = ['normal', 'lent', 'panne']

function readRequestedMode() {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('simulation')
  if (requested === 'reinitialiser') {
    reset()
    sessionStorage.removeItem(MODE_KEY)
    params.delete('simulation')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  } else if (MODES.includes(requested)) {
    sessionStorage.setItem(MODE_KEY, requested)
  }
}

readRequestedMode()

function currentMode() {
  readRequestedMode()
  return sessionStorage.getItem(MODE_KEY) || 'normal'
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const between = (min, max) => min + Math.random() * (max - min)

// Ce qui transite par le « réseau » est copié, comme le serait du JSON : l'interface ne garde
// jamais de référence vers les objets du serveur.
const copy = (value) => (value === undefined || value === null ? value : JSON.parse(JSON.stringify(value)))

export async function simulate(method, path, body) {
  const mode = currentMode()
  await wait(mode === 'lent' ? between(2000, 3200) : mode === 'panne' ? between(900, 1400) : between(250, 600))
  if (mode === 'panne') return { status: 0, body: null }
  try {
    const response = await handle(method, path, copy(body))
    return { status: response.status, body: copy(response.body) }
  } catch (cause) {
    console.error('Erreur dans le serveur simulé', cause)
    return { status: 500, body: { error: { code: 'server_error', message: 'Le serveur a rencontré une erreur.' } } }
  }
}
