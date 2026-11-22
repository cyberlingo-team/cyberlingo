// Les épisodes parus, leur progression et les statistiques publiques.

import { Router } from 'express'
import prisma from '../prisma.js'
import { methodNotAllowed, HttpError } from '../lib/errors.js'
import { addDays, dayNumber, fromDbDate, isIsoDate, today, toDbDate } from '../lib/dates.js'
import { playerOf } from '../lib/session.js'
import { finishAttemptIfComplete, frozenOf, nextChance, pointsOf, resultsOf, streakAt, streakOf } from '../lib/players.js'
import { checkAnswer, revealed } from '../lib/answers.js'
import { ranking } from '../lib/ranking.js'
import { DISGUISES, GANG, VILLAIN, missionPoints, stageFor } from '../lib/content.js'
import { settleQuests } from './quests.js'

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

// La partie du joueur pour cet épisode, créée à la première réponse. Une partie du jour commencée
// avec un compte et pas finie avant minuit devient un rattrapage, comme dans le serveur simulé.
async function attemptToAnswer(req, player, date) {
  const attempt = await findAttempt(player, date)
  if (attempt) {
    if (attempt.mode === 'counted' && !attempt.completedAt && date !== today()) {
      return prisma.attempt.update({ where: { id: attempt.id }, data: { mode: 'practice' } })
    }
    return attempt
  }
  try {
    return await prisma.attempt.create({ data: { playerId: player.id, date: toDbDate(date), mode: modeOf(req, date, null) } })
  } catch (error) {
    // Deux réponses envoyées en même temps : l'autre requête vient de créer la partie.
    if (error?.code === 'P2002') return findAttempt(player, date)
    throw error
  }
}

router.route('/missions/:date/answers')
  .post(async (req, res) => {
    const date = req.params.date
    const episode = await publishedEpisode(date)
    const question = episode.mission.questions.find((q) => q.id === req.body?.questionId)
    if (!question) throw new HttpError(404, 'question_not_found', 'Cette question ne fait pas partie de l’épisode.')

    const player = await playerOf(req, res, { create: true })
    const existing = await findAttempt(player, date)
    if (existing?.completedAt) throw new HttpError(409, 'already_completed', 'Tu as déjà joué cet épisode.')
    // Vérifiée avant de créer la partie : une réponse mal formée ne laisse rien en base.
    const answer = req.body.answer
    const correct = checkAnswer(question, answer)

    const attempt = await attemptToAnswer(req, player, date)
    try {
      await prisma.answer.create({ data: { attemptId: attempt.id, questionId: question.id, value: answer ?? undefined, correct } })
    } catch (error) {
      if (error?.code === 'P2002') throw new HttpError(409, 'already_answered', 'Tu as déjà répondu à cette question.')
      throw error
    }
    // À la dernière réponse, la partie est close ; si elle compte : ses points et la série.
    const finished = await finishAttemptIfComplete(attempt.id)
    const progress = await progressOf(episode, finished, finished.mode)
    if (progress.completed && date === today()) await settleQuests(player)

    const { answers, ...rest } = progress
    res.json({ ...answers[question.id], progress: rest })
  })
  .all(methodNotAllowed)

// La place du joueur au classement de la semaine, avant et après l'épisode du jour.
async function rankAround(account, day, earned) {
  const after = await ranking('week', day)
  const mine = after.find((row) => row.id === account.id)
  if (!mine) return null
  const before = after
    .map((row) => (row.id === account.id ? { ...row, points: row.points - earned } : row))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username, 'fr'))
  before.forEach((row, i) => {
    row.rank = i > 0 && before[i - 1].points === row.points ? before[i - 1].rank : i + 1
  })
  const target = after.filter((row) => row.points > mine.points).at(-1)
  return {
    period: 'week',
    position: mine.rank,
    previous: before.find((row) => row.id === account.id)?.rank ?? null,
    players: after.length,
    ahead: target ? { username: target.username, rank: target.rank, level: target.level, gap: target.points - mine.points } : null,
    next: await nextChance(account, day),
  }
}

router.route('/missions/:date/result')
  .get(async (req, res) => {
    const date = req.params.date
    const day = today()
    const episode = await publishedEpisode(date)
    const player = await playerOf(req, res)
    const attempt = player
      ? await prisma.attempt.findUnique({
        where: { playerId_date: { playerId: player.id, date: toDbDate(date) } },
        include: { answers: true },
      })
      : null
    const total = episode.mission.questions.length
    if (!attempt || attempt.answers.length < total) {
      throw new HttpError(409, 'not_finished', 'Réponds à toutes les cases pour voir la fin de l’épisode.')
    }

    const correct = attempt.answers.filter((answer) => answer.correct).length
    const villain = villainOf(episode.mission)
    const result = {
      date,
      number: episode.number,
      title: episode.mission.title,
      mode: attempt.mode,
      correct,
      total,
      moral: episode.mission.moral,
      sources: episode.mission.sources,
      villain: villain && { ...villain, quip: VILLAIN.quips[dayNumber(date) % VILLAIN.quips.length] },
      points: null,
      player: null,
      rank: null,
      next: await teaser(),
    }

    // Ce que le visiteur gagnerait avec un compte (premier jour de série).
    if (attempt.mode === 'guest') result.points = missionPoints(correct, total, 1)

    if (attempt.mode === 'counted') {
      const results = await resultsOf(player.id)
      result.points = missionPoints(correct, total, streakAt(results, date, frozenOf(player)))
      if (date === day) {
        const after = await pointsOf(player.id)
        const before = after - (attempt.points ?? 0)
        const streak = streakOf(results, day, frozenOf(player))
        result.player = {
          before: { points: before, stage: stageFor(before) },
          after: { points: after, stage: stageFor(after) },
          streak: { current: streak.current, best: streak.best },
        }
        result.rank = await rankAround(player, day, attempt.points ?? 0)
      }
    }
    res.json(result)
  })
  .all(methodNotAllowed)

export default router
