// Le classement : voir « Le classement » dans frontend/src/api/CONTRAT.md.
//
//   GET /api/leaderboard?period=week|all   les 10 premiers, le joueur connecté et ses voisins

import { Router } from 'express'
import prisma from '../prisma.js'
import { HttpError, methodNotAllowed } from '../lib/errors.js'
import { fromDbDate, today } from '../lib/dates.js'
import { nextChance } from '../lib/players.js'
import { PERIODS, ranking } from '../lib/ranking.js'

const router = Router()

function publicRow(row, meId) {
  return { rank: row.rank, username: row.username, points: row.points, level: row.level, streak: row.streak, me: row.id === meId }
}

// Qui est juste devant le joueur, et combien de points les séparent.
function aheadOf(rows, mine) {
  const target = rows.filter((row) => row.points > mine.points).at(-1)
  return target ? { username: target.username, rank: target.rank, level: target.level, gap: target.points - mine.points } : null
}

router
  .route('/leaderboard')
  .get(async (req, res) => {
    const period = req.query.period ?? 'week'
    if (typeof period !== 'string' || !Object.hasOwn(PERIODS, period)) {
      throw new HttpError(400, 'invalid_period', 'Période inconnue : « week » ou « all ».')
    }
    const day = today()
    const rows = await ranking(period, day)
    const meId = req.account?.id ?? null
    const index = meId ? rows.findIndex((row) => row.id === meId) : -1
    const mine = index >= 0 ? rows[index] : null
    const launch = await prisma.episode.aggregate({ _min: { date: true } })

    res.json({
      period,
      from: PERIODS[period](day) || fromDbDate(launch._min.date),
      to: day,
      players: rows.length,
      top: rows.slice(0, 10).map((row) => publicRow(row, meId)),
      around: mine && index >= 10 ? rows.slice(Math.max(10, index - 2), index + 3).map((row) => publicRow(row, meId)) : [],
      me: mine ? { ...publicRow(mine, meId), ahead: aheadOf(rows, mine), next: await nextChance(req.account, day) } : null,
    })
  })
  .all(methodNotAllowed)

export default router
