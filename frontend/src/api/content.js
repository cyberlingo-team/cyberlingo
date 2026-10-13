// Les contenus fixes : les règles du jeu (stades du Tux, barème) et les personnages.

import { request } from './http.js'

// GET /api/game
export function getGame() {
  return request('GET', '/game')
}

// GET /api/cast
export function getCast() {
  return request('GET', '/cast')
}
