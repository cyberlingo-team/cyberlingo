// Qui est connecté ? La session est un cookie httpOnly posé par le serveur : l'interface ne voit
// jamais de jeton. Elle pose la question au serveur (GET /api/session) et partage la réponse
// entre tous les écrans grâce à cet objet réactif.

import { reactive } from 'vue'
import { getSession, login as apiLogin, signup as apiSignup, logout as apiLogout } from '../api/index.js'

export const session = reactive({
  user: null,
  // 'loading' tant que le serveur n'a pas répondu, puis 'ready', ou 'error' s'il ne répond pas.
  status: 'loading',
  error: null,
})

let pending = null

export function loadSession({ force = false } = {}) {
  if (pending && !force) return pending
  if (session.status !== 'ready') session.status = 'loading'
  pending = getSession()
    .then(({ user }) => {
      session.user = user
      session.status = 'ready'
      session.error = null
      return user
    })
    .catch((error) => {
      // Le serveur ne répond pas : on retentera à la prochaine demande.
      pending = null
      if (session.status !== 'ready') session.status = 'error'
      session.error = error
      return session.user
    })
  return pending
}

// Après un épisode, les points et la série du joueur ont changé : on redemande.
export function refreshSession() {
  return loadSession({ force: true })
}

function connected(user) {
  session.user = user
  session.status = 'ready'
  session.error = null
  pending = Promise.resolve(user)
}

export async function login(username, password) {
  const result = await apiLogin(username, password)
  connected(result.user)
  return result
}

export async function signup(username, password) {
  const result = await apiSignup(username, password)
  connected(result.user)
  return result
}

export async function logout() {
  await apiLogout()
  connected(null)
}

// Le compte vient d'être supprimé, ou le pseudo a changé : on met la session à jour.
export function setSessionUser(user) {
  connected(user)
}
