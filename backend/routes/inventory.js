// Réserve et boutique : voir « Le parcours, la réserve et les quêtes » dans CONTRAT.md.

import { Router } from 'express'
import prisma from '../prisma.js'
import { HttpError, methodNotAllowed } from '../lib/errors.js'
import { playerOf, requireAccount } from '../lib/session.js'
import { today, toDbDate, fromDbDate, addDays } from '../lib/dates.js'
import { SHOP, MAX_BUOYS, MAX_FREEZES, STAGES } from '../lib/content.js'

const router = Router()
const SHOP_ITEMS = [
  { id: 'bouees', title: 'Bouées regonflées', description: 'Retrouve tes cinq bouées tout de suite, sans attendre cette nuit.' },
  { id: 'glacon', title: 'Glaçon', description: 'Il gèle ta série un jour où tu ne fais pas la mission du jour. Tu peux en garder deux.' },
]

function stageFor(points) {
  let stage = STAGES[0]
  for (const candidate of STAGES) if (points >= candidate.minPoints) stage = candidate
  return { level: stage.level, name: stage.name }
}

async function preparePlayer(player, day) {
  let data = {}
  if (!player.buoysRefilledOn || fromDbDate(player.buoysRefilledOn) !== day) {
    data.buoys = MAX_BUOYS
    data.buoysRefilledOn = toDbDate(day)
  }

  // Un glaçon couvre tous les jours manqués depuis la dernière activité, à condition
  // d'en avoir un pour chacun.
  if (player.username && player.freezes > 0) {
    const attempts = await prisma.attempt.findMany({ where: { playerId: player.id, mode: 'counted', completedAt: { not: null } }, select: { date: true } })
    const lastPlayed = attempts.map((attempt) => fromDbDate(attempt.date)).sort().at(-1)
    const frozen = player.frozenDays.map(fromDbDate)
    const last = [...(lastPlayed ? [lastPlayed] : []), ...frozen].sort().at(-1)
    if (last) {
      const missed = Math.max(0, (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86400000 - 1)
      if (missed > 0 && missed <= player.freezes) {
        data.freezes = player.freezes - missed
        data.frozenDays = { push: Array.from({ length: missed }, (_, index) => toDbDate(addDays(last, index + 1))) }
      }
    }
  }
  if (Object.keys(data).length) player = await prisma.player.update({ where: { id: player.id }, data })
  return player
}

export async function inventoryOf(player, day = today()) {
  player = await preparePlayer(player, day)
  const [attempts, lessons] = await Promise.all([
    prisma.attempt.findMany({ where: { playerId: player.id, mode: 'counted', completedAt: { not: null } }, select: { date: true, points: true } }),
    prisma.lessonRun.aggregate({ where: { playerId: player.id, completedOn: { not: null } }, _sum: { points: true } }),
  ])
  const points = attempts.reduce((sum, attempt) => sum + (attempt.points ?? 0), 0) + (lessons._sum.points ?? 0)
  const played = new Set(attempts.map((attempt) => fromDbDate(attempt.date)))
  const frozen = new Set(player.frozenDays.map(fromDbDate))
  let cursor = played.has(day) || frozen.has(day) ? day : addDays(day, -1)
  let streak = 0
  while (played.has(cursor) || frozen.has(cursor)) { streak++; cursor = addDays(cursor, -1) }
  return {
    points,
    stage: stageFor(points),
    streak: { current: streak, playedToday: played.has(day) },
    sardines: player.sardines,
    buoys: { count: player.buoys, max: MAX_BUOYS },
    freezes: { count: player.freezes, max: MAX_FREEZES },
  }
}

function shopItems(player) {
  return SHOP_ITEMS.map((item) => {
    const owned = item.id === 'bouees' ? { count: player.buoys, max: MAX_BUOYS } : { count: player.freezes, max: MAX_FREEZES }
    let reason = null
    if (item.id === 'bouees' && owned.count >= MAX_BUOYS) reason = 'Tes bouées sont déjà toutes gonflées.'
    if (item.id === 'glacon' && owned.count >= MAX_FREEZES) reason = `Tu as déjà ${MAX_FREEZES} glaçons en réserve.`
    if (!reason && player.sardines < SHOP[item.id].price) reason = 'Pas assez de sardines.'
    return { ...item, price: SHOP[item.id].price, owned, available: !reason, reason }
  })
}

router.route('/inventory').get(async (req, res) => {
  const player = await playerOf(req, res, { create: true })
  res.json(await inventoryOf(player))
}).all(methodNotAllowed)

router.route('/shop').get(async (req, res) => {
  const account = requireAccount(req)
  const player = await preparePlayer(account, today())
  res.json({ sardines: player.sardines, items: shopItems(player) })
}).all(methodNotAllowed)

router.route('/shop/:id').post(async (req, res) => {
  const account = requireAccount(req)
  const item = SHOP_ITEMS.find(({ id }) => id === req.params.id)
  if (!item) throw new HttpError(404, 'item_not_found', 'Cet article n’existe pas.')
  const day = today()
  const result = await prisma.$transaction(async (tx) => {
    let player = await tx.player.findUniqueOrThrow({ where: { id: account.id } })
    if (!player.buoysRefilledOn || fromDbDate(player.buoysRefilledOn) !== day) {
      player = await tx.player.update({ where: { id: player.id }, data: { buoys: MAX_BUOYS, buoysRefilledOn: toDbDate(day) } })
    }
    const owned = item.id === 'bouees' ? player.buoys : player.freezes
    if (item.id === 'bouees' && owned >= MAX_BUOYS) throw new HttpError(409, 'already_full', 'Tes bouées sont déjà toutes gonflées.')
    if (item.id === 'glacon' && owned >= MAX_FREEZES) throw new HttpError(409, 'max_reached', `Tu as déjà ${MAX_FREEZES} glaçons en réserve.`)
    if (player.sardines < SHOP[item.id].price) throw new HttpError(409, 'not_enough_sardines', 'Pas assez de sardines pour cet article.')
    return tx.player.update({ where: { id: player.id }, data: { sardines: { decrement: SHOP[item.id].price }, ...(item.id === 'bouees' ? { buoys: MAX_BUOYS, buoysRefilledOn: toDbDate(day) } : { freezes: { increment: 1 } }) } })
  })
  res.json({ inventory: await inventoryOf(result, day) })
}).all(methodNotAllowed)

export default router
