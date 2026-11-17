// La réserve de la banquise d'un joueur : les bouées, qui se regonflent chaque nuit.

import prisma from '../prisma.js'
import { MAX_BUOYS } from './content.js'
import { fromDbDate, toDbDate } from './dates.js'

// Le joueur avec ses bouées à jour : un nouveau jour (heure de Paris) les regonfle toutes.
export async function withFreshBuoys(player, today, client = prisma) {
  if (fromDbDate(player.buoysRefilledOn) === today) return player
  return client.player.update({ where: { id: player.id }, data: { buoys: MAX_BUOYS, buoysRefilledOn: toDbDate(today) } })
}
