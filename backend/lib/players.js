// Points, série et stade d'un joueur, calculés depuis la base. Les routes s'en servent pour
// SessionUser (GET /api/session), et s'en serviront pour Mon Tux, le classement, le chemin…
//
// Un joueur gagne des points de deux façons :
//   - la mission du jour, jouée le jour même (Attempt en mode `counted`, terminé) ;
//   - les leçons du chemin, la première fois (LessonRun.points).

import prisma from '../prisma.js'
import { stageFor, missionPoints } from './content.js'
import { addDays, fromDbDate, toDbDate } from './dates.js'

// Les épisodes qui comptent pour un joueur, par date : { '2026-10-12': { points: 62 }, … }.
export async function resultsOf(playerId) {
  const attempts = await prisma.attempt.findMany({
    where: { playerId, mode: 'counted', completedAt: { not: null } },
    select: { date: true, points: true },
  })
  return Object.fromEntries(attempts.map((attempt) => [fromDbDate(attempt.date), { points: attempt.points ?? 0 }]))
}

// Tous les points d'un joueur, depuis une date « AAAA-MM-JJ » (comprise) ou depuis toujours.
export async function pointsOf(playerId, fromDate = null) {
  const missions = await prisma.attempt.aggregate({
    _sum: { points: true },
    where: { playerId, mode: 'counted', completedAt: { not: null }, ...(fromDate ? { date: { gte: toDbDate(fromDate) } } : {}) },
  })
  const lessons = await prisma.lessonRun.aggregate({
    _sum: { points: true },
    where: { playerId, completedOn: fromDate ? { gte: toDbDate(fromDate) } : { not: null } },
  })
  return (missions._sum.points ?? 0) + (lessons._sum.points ?? 0)
}

// Série en cours : elle reste vivante tant que la journée n'est pas finie. Les jours gelés par
// un glaçon (`frozen`) la prolongent sans rapporter de points.
export function streakOf(results, today, frozen = []) {
  const played = Object.keys(results)
  const dates = new Set([...played, ...frozen])
  let current = 0
  let cursor = dates.has(today) ? today : addDays(today, -1)
  while (dates.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  let best = 0
  let run = 0
  let previous = null
  for (const date of [...dates].sort()) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  const lastPlayed = played.sort().at(-1) || null
  return { current, best, playedToday: Boolean(results[today]), lastPlayed }
}

// Série au soir d'une date donnée (sert au bonus de série de cette date-là).
export function streakAt(results, date, frozen = []) {
  let streak = 0
  let cursor = date
  while (results[cursor] || frozen.includes(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function frozenOf(player) {
  return (player.frozenDays || []).map(fromDbDate)
}

// SessionUser : le joueur connecté en bref, de quoi afficher son Tux et ses points partout.
export async function sessionUser(account, today) {
  const [results, points] = await Promise.all([resultsOf(account.id), pointsOf(account.id)])
  const stage = stageFor(points)
  const streak = streakOf(results, today, frozenOf(account))
  return {
    username: account.username,
    createdAt: fromDbDate(account.createdOn),
    points,
    stage: { level: stage.level, name: stage.name },
    streak: { current: streak.current, playedToday: streak.playedToday },
  }
}

// Clôt une partie d'épisode quand toutes ses questions ont une réponse. Pour une partie qui
// compte, calcule ses points : 10 par bonne réponse, 10 pour un sans-faute, et le bonus de série.
// Renvoie la partie à jour.
export async function finishAttemptIfComplete(attemptId) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { answers: true, episode: { include: { mission: true } } },
  })
  const total = attempt.episode.mission.questions.length
  if (attempt.completedAt || attempt.answers.length < total) return attempt

  let points = null
  if (attempt.mode === 'counted') {
    const player = await prisma.player.findUnique({ where: { id: attempt.playerId } })
    const date = fromDbDate(attempt.date)
    const results = await resultsOf(attempt.playerId)
    delete results[date]
    const streak = streakAt(results, addDays(date, -1), frozenOf(player)) + 1
    const correct = attempt.answers.filter((answer) => answer.correct).length
    points = missionPoints(correct, total, streak).total
  }
  return prisma.attempt.update({ where: { id: attemptId }, data: { completedAt: new Date(), points } })
}

// Les réponses données sans compte rejoignent le compte quand on s'inscrit ou qu'on se connecte
// (voir « Visiteur sans compte » dans CONTRAT.md) : l'épisode du jour compte s'il n'était pas
// déjà joué, les épisodes passés deviennent des rattrapages. Renvoie `Claimed`, ou null.
//
// À l'inscription, `guest` et `account` sont la même ligne (le visiteur devient le compte) ;
// à la connexion, ce sont deux joueurs, et le visiteur disparaît une fois ses parties reprises.
export async function claimGuest(guest, account, today) {
  if (!guest) return null
  const attempts = await prisma.attempt.findMany({
    where: { playerId: guest.id },
    include: { _count: { select: { answers: true } } },
  })
  const alreadyPlayed = new Set()
  if (guest.id !== account.id) {
    const own = await prisma.attempt.findMany({ where: { playerId: account.id }, select: { date: true } })
    own.forEach((attempt) => alreadyPlayed.add(fromDbDate(attempt.date)))
  }

  let claimed = null
  for (const attempt of attempts) {
    const date = fromDbDate(attempt.date)
    if (!attempt._count.answers || alreadyPlayed.has(date)) continue
    const isToday = date === today
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { playerId: account.id, mode: isToday ? 'counted' : 'practice', completedAt: null, points: null },
    })
    const finished = await finishAttemptIfComplete(attempt.id)
    if (isToday) {
      claimed = { date, answered: attempt._count.answers, completed: Boolean(finished.completedAt), points: finished.points ?? 0 }
    }
  }
  // Ce qui n'a pas été repris (un épisode que le compte avait déjà joué) part avec le visiteur.
  if (guest.id !== account.id) await prisma.player.delete({ where: { id: guest.id } })
  return claimed
}

// Le prochain épisode qui peut rapporter des points au joueur (celui du jour s'il ne l'a pas
// encore joué, sinon celui de demain) et ce qu'il rapporte au plus, série comprise.
// Renvoie null si cet épisode n'est pas encore programmé.
export async function nextChance(player, today) {
  const streak = streakOf(await resultsOf(player.id), today, frozenOf(player))
  const date = streak.playedToday ? addDays(today, 1) : today
  const episode = await prisma.episode.findUnique({ where: { date: toDbDate(date) }, include: { mission: true } })
  if (!episode) return null
  const count = episode.mission.questions.length
  return { date, maxPoints: missionPoints(count, count, streak.current + 1).total }
}
