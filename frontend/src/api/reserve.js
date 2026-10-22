// La réserve du joueur (points, série, sardines, bouées, glaçons), la boutique et les quêtes.

import { request } from './http.js'

// GET /api/inventory
export function getInventory() {
  return request('GET', '/inventory')
}

// GET /api/shop
export function getShop() {
  return request('GET', '/shop')
}

// POST /api/shop/:id
export function buy(itemId) {
  return request('POST', `/shop/${encodeURIComponent(itemId)}`)
}

// GET /api/quests
export function getQuests() {
  return request('GET', '/quests')
}
