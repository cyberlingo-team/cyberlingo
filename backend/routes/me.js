// Le joueur connecté : voir « Le joueur connecté » dans frontend/src/api/CONTRAT.md.
//
//   GET    /api/me            tout ce que montre « Mon Tux »
//   PATCH  /api/me            changer de pseudo
//   PUT    /api/me/password   changer de mot de passe
//   DELETE /api/me            supprimer le compte

import { Router } from 'express'
import prisma from '../prisma.js'
import { HttpError, methodNotAllowed } from '../lib/errors.js'
import { addDays, fromDbDate, today, toDbDate } from '../lib/dates.js'
import { closeSession, requireAccount } from '../lib/session.js'
import { frozenOf, resultsOf, sessionUser, streakOf, pointsOf } from '../lib/players.js'
import { PERIODS, ranking } from '../lib/ranking.js'
import { STAGES, UNITS, lessonContent, stageFor } from '../lib/content.js'
import { hashPassword, passwordMatches, passwordProblem, usernameKey, usernameProblem } from '../lib/accounts.js'

const router = Router()

const DAYS_SHOWN = 28

// Les succès, chacun en paliers : `tiers` sont les valeurs à atteindre.
const ACHIEVEMENTS = [
  { id: 'serie', title: 'Fidèle au poste', unit: 'jours de série', icon: 'flamme', tiers: [3, 7, 14, 30], metric: (s) => s.bestStreak },
  { id: 'sans-faute', title: 'Sans-faute', unit: 'sans-fautes', icon: 'cible', tiers: [1, 5, 15, 40], metric: (s) => s.perfect },
  { id: 'themes', title: 'Tour de la banquise', unit: 'thèmes terminés', icon: 'igloo', tiers: [1, 2, 4, UNITS.length], metric: (s) => s.units },
  { id: 'muscles', title: 'Gonflé à bloc', unit: 'stade du Tux', icon: 'haltere', tiers: [2, 4, 6, 7], metric: (s) => s.level },
  { id: 'missions', title: 'Mission accomplie', unit: 'missions du jour', icon: 'trophee', tiers: [1, 10, 25, 50], metric: (s) => s.missions },
]

function achievementsOf(stats) {
  return ACHIEVEMENTS.map((achievement) => {
    const value = achievement.metric(stats)
    const level = achievement.tiers.filter((tier) => value >= tier).length
    const goal = achievement.tiers[Math.min(level, achievement.tiers.length - 1)]
    return { id: achievement.id, title: achievement.title, icon: achievement.icon, level, maxLevel: achievement.tiers.length, value, goal, unit: achievement.unit }
  })
}

// La place du joueur au classement d'une période, ou null s'il n'a pas de points.
async function rankIn(period, account, day) {
  const rows = await ranking(period, day)
  const mine = rows.find((row) => row.id === account.id)
  return mine ? { position: mine.rank, players: rows.length } : null
}

async function profileOf(account, day) {
  const weekStart = PERIODS.week(day)
  const daysStart = addDays(day, 1 - DAYS_SHOWN)

  const [attempts, lessonRuns, chests, episodes, points, rankWeek, rankAll] = await Promise.all([
    prisma.attempt.findMany({
      where: { playerId: account.id, mode: 'counted', completedAt: { not: null } },
      include: { answers: { select: { correct: true } }, episode: { select: { mission: { select: { questions: true } } } } },
    }),
    prisma.lessonRun.findMany({ where: { playerId: account.id, completedOn: { not: null } } }),
    prisma.chestOpening.findMany({ where: { playerId: account.id }, select: { chestId: true } }),
    prisma.episode.findMany({
      where: { date: { gte: toDbDate(daysStart), lte: toDbDate(day) } },
      orderBy: { date: 'asc' },
      select: { date: true, number: true, mission: { select: { title: true } } },
    }),
    pointsOf(account.id),
    rankIn('week', account, day),
    rankIn('all', account, day),
  ])

  const results = await resultsOf(account.id)
  const played = new Map(
    attempts.map((attempt) => [
      fromDbDate(attempt.date),
      {
        correct: attempt.answers.filter((answer) => answer.correct).length,
        total: attempt.episode.mission.questions.length,
        points: attempt.points ?? 0,
      },
    ]),
  )
  const streak = streakOf(results, day, frozenOf(account))
  const stage = stageFor(points)
  const createdAt = fromDbDate(account.createdOn)

  // Les points gagnés chaque jour de la semaine, missions et leçons ensemble.
  const byDay = new Map()
  const credit = (date, amount) => byDay.set(date, (byDay.get(date) || 0) + amount)
  for (const attempt of attempts) credit(fromDbDate(attempt.date), attempt.points ?? 0)
  for (const run of lessonRuns) credit(fromDbDate(run.completedOn), run.points ?? 0)
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    return { date, points: byDay.get(date) || 0 }
  })

  const perfectLessons = lessonRuns.filter((run) => run.correct === lessonContent(run.lessonId)?.questions.length).length
  const perfectMissions = [...played.values()].filter((entry) => entry.correct === entry.total).length
  const done = new Set([...lessonRuns.map((run) => run.lessonId), ...chests.map((chest) => chest.chestId)])
  const stats = {
    bestStreak: streak.best,
    perfect: perfectMissions + perfectLessons,
    units: UNITS.filter((unit) => done.has(`bilan-${unit.id}`)).length,
    level: stage.level,
    missions: played.size,
  }

  const days = episodes.map((episode) => {
    const date = fromDbDate(episode.date)
    const result = played.get(date)
    const status = result ? 'played' : date === day ? 'today' : date < createdAt ? 'before' : 'missed'
    return { date, number: episode.number, title: episode.mission.title, status, ...(result ?? {}) }
  })

  const answers = [...played.values()]
  return {
    user: { username: account.username, createdAt },
    points,
    stage: { ...stage, motto: STAGES[stage.level].motto },
    streak,
    rank: { week: rankWeek, all: rankAll },
    totals: {
      episodes: answers.length,
      correct: answers.reduce((sum, entry) => sum + entry.correct, 0),
      questions: answers.reduce((sum, entry) => sum + entry.total, 0),
      lessons: lessonRuns.filter((run) => (run.points ?? 0) > 0).length,
    },
    week,
    achievements: achievementsOf(stats),
    days,
  }
}

router
  .route('/me')
  .get(async (req, res) => {
    res.json(await profileOf(requireAccount(req), today()))
  })
  .patch(async (req, res) => {
    const account = requireAccount(req)
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
    const issue = usernameProblem(username)
    if (issue) throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', { username: issue })

    const taken = new HttpError(409, 'username_taken', 'Le formulaire contient des erreurs.', { username: 'Ce pseudo est déjà pris.' })
    const owner = await prisma.player.findUnique({ where: { usernameKey: usernameKey(username) } })
    if (owner && owner.id !== account.id) throw taken
    let updated
    try {
      updated = await prisma.player.update({ where: { id: account.id }, data: { username, usernameKey: usernameKey(username) } })
    } catch (error) {
      // Deux joueurs qui prennent le même pseudo en même temps : la base n'en accepte qu'un.
      throw error?.code === 'P2002' ? taken : error
    }
    res.json({ user: await sessionUser(updated, today()) })
  })
  .delete(async (req, res) => {
    const account = requireAccount(req)
    if (!(await passwordMatches(req.body?.password, account.passwordHash))) {
      throw new HttpError(403, 'wrong_password', 'Le formulaire contient des erreurs.', { password: 'Ce n’est pas ton mot de passe.' })
    }
    // Les parties, leçons, coffres et quêtes partent avec lui (onDelete: Cascade).
    await prisma.player.delete({ where: { id: account.id } })
    closeSession(res)
    res.status(204).end()
  })
  .all(methodNotAllowed)

router
  .route('/me/password')
  .put(async (req, res) => {
    const account = requireAccount(req)
    const { currentPassword, newPassword } = req.body ?? {}
    if (!(await passwordMatches(currentPassword, account.passwordHash))) {
      throw new HttpError(403, 'wrong_password', 'Le formulaire contient des erreurs.', { currentPassword: 'Ce n’est pas ton mot de passe actuel.' })
    }
    const issue = passwordProblem(newPassword, account.username)
    if (issue) throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', { newPassword: issue })
    if (newPassword === currentPassword) {
      throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', { newPassword: 'Choisis un mot de passe différent de l’actuel.' })
    }
    await prisma.player.update({ where: { id: account.id }, data: { passwordHash: await hashPassword(newPassword) } })
    res.status(204).end()
  })
  .all(methodNotAllowed)

export default router
