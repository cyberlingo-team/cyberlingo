// Les épisodes parus, leur progression et les statistiques publiques.

import { Router } from 'express'
import prisma from '../prisma.js'
import { methodNotAllowed, HttpError } from '../lib/errors.js'
import { addDays, fromDbDate, isIsoDate, today, toDbDate } from '../lib/dates.js'
import { playerOf } from '../lib/session.js'
import { resultsOf } from '../lib/players.js'
import { DISGUISES, GANG, VILLAIN } from '../lib/content.js'

const router = Router()

function guestOf(mission) {
  const guest = GANG[mission.guest]
  return { id: guest.id, name: guest.name, tagline: guest.tagline, look: guest.look }
}

function villainOf(mission) {
  return mission.villain
    ? { id: mission.villain, name: VILLAIN.name, disguise: DISGUISES[mission.villain] }
    : null
}

// Cette sélection explicite garantit qu'aucune réponse ni explication ne part avant le jeu.
function publicQuestion(question) {
  const { id, kind, scene, line, artifact, prompt, options, pick } = question
  return {
    id,
    kind,
    scene,
    line: line || null,
    artifact: artifact || null,
    prompt,
    ...(kind === 'choice' ? { options } : {}),
    ...(kind === 'clues' ? { pick } : {}),
  }
}

function publicMission(episode) {
  const date = fromDbDate(episode.date)
  return {
    date,
    number: episode.number,
    title: episode.mission.title,
    theme: episode.mission.theme,
    hook: episode.mission.hook,
    guest: guestOf(episode.mission),
    questions: episode.mission.questions.map(publicQuestion),
  }
}

async function publishedEpisode(date) {
  if (!isIsoDate(date) || date > today()) {
    throw new HttpError(404, 'mission_not_found', 'Aucun épisode n’est paru à cette date.')
  }
  const episode = await prisma.episode.findUnique({ where: { date: toDbDate(date) }, include: { mission: true } })
  if (!episode) throw new HttpError(404, 'mission_not_found', 'Aucun épisode n’est paru à cette date.')
  return episode
}

function modeOf(req, date, attempt) {
  if (attempt) return attempt.mode
  if (req.account) return date === today() ? 'counted' : 'practice'
  return date === today() ? 'guest' : 'practice'
}

async function findAttempt(player, date) {
  return prisma.attempt.findUnique({
    where: { playerId_date: { playerId: player.id, date: toDbDate(date) } },
  })
}

async function successRates(episode) {
  const attempts = await prisma.attempt.findMany({
    where: { date: episode.date, mode: 'counted', completedAt: { not: null } },
    select: { answers: { select: { questionId: true, correct: true } } },
  })
  return Object.fromEntries(episode.mission.questions.map((question) => {
    const answers = attempts.flatMap((attempt) => attempt.answers).filter((answer) => answer.questionId === question.id)
    const rate = answers.length
      ? Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100)
      : Math.round((question.success ?? 0) * 100)
    return [question.id, rate]
  }))
}

async function progressOf(episode, attempt, mode) {
  const saved = attempt
    ? await prisma.answer.findMany({ where: { attemptId: attempt.id } })
    : []
  const rates = saved.length ? await successRates(episode) : {}
  const savedById = new Map(saved.map((answer) => [answer.questionId, answer]))
  const answers = {}
  for (const question of episode.mission.questions) {
    const answer = savedById.get(question.id)
    if (!answer) continue
    answers[question.id] = {
      answer: answer.value,
      correct: answer.correct,
      solution: question.answer,
      explanation: question.explanation,
      notes: question.notes || [],
      success: rates[question.id],
    }
  }
  const answered = Object.keys(answers).length
  return { mode, answers, answered, total: episode.mission.questions.length, completed: answered === episode.mission.questions.length }
}

async function stats(episode) {
  const attempts = await prisma.attempt.findMany({
    where: { date: episode.date, mode: 'counted', completedAt: { not: null } },
    select: { answers: { select: { correct: true } } },
  })
  const total = attempts.reduce((sum, attempt) => sum + attempt.answers.length, 0)
  const correct = attempts.reduce((sum, attempt) => sum + attempt.answers.filter((answer) => answer.correct).length, 0)
  return {
    players: attempts.length,
    successRate: total ? Math.round((correct / total) * 100) : null,
  }
}

async function teaser() {
  const nextDate = addDays(today(), 1)
  const episode = await prisma.episode.findUnique({ where: { date: toDbDate(nextDate) }, include: { mission: true } })
  if (!episode) return null
  return {
    date: nextDate,
    number: episode.number,
    hook: episode.mission.hook,
    guest: guestOf(episode.mission),
    villain: villainOf(episode.mission),
  }
}

router.route('/missions/today')
  .get(async (req, res) => {
    const date = today()
    const episode = await publishedEpisode(date)
    const player = await playerOf(req, res, { create: true })
    const attempt = await findAttempt(player, date)
    res.json({
      mission: publicMission(episode),
      progress: await progressOf(episode, attempt, modeOf(req, date, attempt)),
      stats: await stats(episode),
      next: await teaser(),
    })
  })
  .all(methodNotAllowed)

router.route('/missions')
  .get(async (req, res) => {
    const day = today()
    const player = await playerOf(req, res, { create: true })
    const episodes = await prisma.episode.findMany({
      where: { date: { lte: toDbDate(day) } },
      include: { mission: true },
      orderBy: { date: 'desc' },
    })
    const results = req.account ? await resultsOf(player.id) : {}
    const joined = fromDbDate(player.createdOn)
    const list = await Promise.all(episodes.map(async (episode) => {
      const date = fromDbDate(episode.date)
      const attempt = await findAttempt(player, date)
      const answers = attempt
        ? await prisma.answer.findMany({ where: { attemptId: attempt.id }, select: { correct: true } })
        : []
      const total = episode.mission.questions.length
      let status
      if (results[date]) status = 'played'
      else if (answers.length === total) status = 'practiced'
      else if (answers.length) status = 'started'
      else if (date === day) status = 'today'
      else if (req.account && date >= joined) status = 'missed'
      else status = 'unplayed'

      return {
        date,
        number: episode.number,
        title: episode.mission.title,
        theme: episode.mission.theme,
        guest: guestOf(episode.mission),
        villain: status === 'played' || status === 'practiced' ? villainOf(episode.mission) : null,
        questionCount: total,
        status,
        score: status === 'played'
          ? { correct: answers.filter((answer) => answer.correct).length, total, points: results[date].points }
          : status === 'practiced'
            ? { correct: answers.filter((answer) => answer.correct).length, total, points: 0 }
            : null,
        stats: await stats(episode),
      }
    }))
    res.json({ episodes: list })
  })
  .all(methodNotAllowed)

router.route('/missions/:date')
  .get(async (req, res) => {
    const date = req.params.date
    const episode = await publishedEpisode(date)
    const player = await playerOf(req, res, { create: true })
    const attempt = await findAttempt(player, date)
    res.json({
      mission: publicMission(episode),
      progress: await progressOf(episode, attempt, modeOf(req, date, attempt)),
    })
  })
  .all(methodNotAllowed)

export default router
