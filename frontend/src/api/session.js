// Comptes et session. Une fonction par route : voir CONTRAT.md.

import { request } from './http.js'

// GET /api/session : qui est connecté sur ce navigateur ?
export function getSession() {
  return request('GET', '/session')
}

// GET /api/auth/rules : longueurs permises pour le pseudo et le mot de passe.
export function getAccountRules() {
  return request('GET', '/auth/rules')
}

// POST /api/auth/signup
export function signup(username, password) {
  return request('POST', '/auth/signup', { username, password })
}

// POST /api/auth/login
export function login(username, password) {
  return request('POST', '/auth/login', { username, password })
}

// POST /api/auth/logout
export function logout() {
  return request('POST', '/auth/logout')
}
