// La réserve du joueur, affichée en haut de chaque écran de l'appli : stade du Tux, série,
// sardines et bouées. Elle vient du serveur (GET /api/inventory) et se recharge après chaque
// action qui la change (leçon finie, coffre ouvert, achat, connexion…).

import { reactive } from 'vue'
import { getInventory } from '../api/index.js'

export const inventory = reactive({
  data: null,
  status: 'loading',
})

let pending = null

export function loadInventory({ force = false } = {}) {
  if (pending && !force) return pending
  pending = getInventory()
    .then((data) => {
      inventory.data = data
      inventory.status = 'ready'
      return data
    })
    .catch(() => {
      pending = null
      if (!inventory.data) inventory.status = 'error'
      return inventory.data
    })
  return pending
}

export function refreshInventory() {
  return loadInventory({ force: true })
}

// Une route renvoie déjà la réserve à jour (achat, coffre) : pas besoin de la redemander.
export function setInventory(data) {
  inventory.data = data
  inventory.status = 'ready'
  pending = Promise.resolve(data)
}
