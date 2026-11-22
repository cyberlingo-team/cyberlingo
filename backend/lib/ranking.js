// Le classement des joueurs, calculé depuis la base. Sert à GET /api/leaderboard et à « Mon Tux ».

import prisma from '../prisma.js'
import { addDays, fromDbDate, toDbDate } from './dates.js'
import { stageFor } from './content.js'
import { frozenOf, streakOf } from './players.js'

// Première date prise en compte : les 7 derniers jours (aujourd'hui compris), ou depuis toujours.
export const PERIODS = {
  week: (day) => addDays(day, -6),
  all: () => null,
}

// Tous les joueurs qui ont des points sur la période, classés. Quelques requêtes en tout, quel que
// soit le nombre de joueurs : deux `groupBy` pour les points, une lecture pour les séries.
export async function ranking(period, day) {
  const from = PERIODS[period](day)
  const since = from ? { gte: toDbDate(from) } : undefined

  const [missionsAll, lessonsAll, missionsSince, lessonsSince, attempts] = await Promise.all([
    prisma.attempt.groupBy({ by: ['playerId'], _sum: { points: true }, where: { mode: 'counted', completedAt: { not: null } } }),
    prisma.lessonRun.groupBy({ by: ['playerId'], _sum: { points: true }, where: { completedOn: { not: null } } }),
    from
      ? prisma.attempt.groupBy({ by: ['playerId'], _sum: { points: true }, where: { mode: 'counted', completedAt: { not: null }, date: since } })
      : null,
    from ? prisma.lessonRun.groupBy({ by: ['playerId'], _sum: { points: true }, where: { completedOn: since } }) : null,
    prisma.attempt.findMany({ where: { mode: 'counted', completedAt: { not: null } }, select: { playerId: true, date: true, points: true } }),
  ])

  const add = (map, rows) => {
    for (const row of rows || []) map.set(row.playerId, (map.get(row.playerId) || 0) + (row._sum.points ?? 0))
    return map
  }
  const total = add(add(new Map(), missionsAll), lessonsAll)
  const period_ = from ? add(add(new Map(), missionsSince), lessonsSince) : total

  const ids = [...period_].filter(([, points]) => points > 0).map(([id]) => id)
  const players = await prisma.player.findMany({
    where: { id: { in: ids }, username: { not: null } },
    select: { id: true, username: true, frozenDays: true },
  })

  const results = new Map()
  for (const attempt of attempts) {
    if (!results.has(attempt.playerId)) results.set(attempt.playerId, {})
    results.get(attempt.playerId)[fromDbDate(attempt.date)] = { points: attempt.points ?? 0 }
  }

  const rows = players
    .map((player) => ({
      id: player.id,
      username: player.username,
      points: period_.get(player.id),
      level: stageFor(total.get(player.id) ?? 0).level,
      streak: streakOf(results.get(player.id) || {}, day, frozenOf(player)).current,
    }))
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username, 'fr'))
  // À points égaux, même rang.
  rows.forEach((row, i) => {
    row.rank = i > 0 && rows[i - 1].points === row.points ? rows[i - 1].rank : i + 1
  })
  return rows
}
