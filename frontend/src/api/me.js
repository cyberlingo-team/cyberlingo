// Le joueur connecté : profil, pseudo, mot de passe, suppression du compte.

import { request } from './http.js'

// GET /api/me
export function getMe() {
  return request('GET', '/me')
}

// PATCH /api/me
export function renameMe(username) {
  return request('PATCH', '/me', { username })
}

// PUT /api/me/password
export function changePassword(currentPassword, newPassword) {
  return request('PUT', '/me/password', { currentPassword, newPassword })
}

// DELETE /api/me
export function deleteAccount(password) {
  return request('DELETE', '/me', { password })
}
