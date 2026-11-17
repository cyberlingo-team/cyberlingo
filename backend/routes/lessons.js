// Jouer une leçon du chemin : voir « Le parcours, la réserve et les quêtes » dans
// frontend/src/api/CONTRAT.md.
//
//   POST /api/lessons/:id/start     commencer une leçon (ou reprendre celle qui est en cours)
//   POST /api/lessons/:id/answers   répondre à une question
//   GET  /api/lessons/:id/result    le bilan d'une leçon finie
//
// Chaque partie est une ligne LessonRun : `answers` y garde { [questionId]: { answer, correct } }
// tant que la leçon est en cours, et `completedOn` la clôt. Les quêtes (`quests` dans le bilan)
// viennent avec la route /api/quests : le bilan les renvoie vides en attendant.

import { Router } from 'express'
import prisma from '../prisma.js'
import { HttpError, methodNotAllowed } from '../lib/errors.js'
import { today, toDbDate } from '../lib/dates.js'
import { playerOf } from '../lib/session.js'
import { MAX_BUOYS, SARDINES, lessonContent, lessonPoints, nodeById, stageFor } from '../lib/content.js'
import { checkAnswer, guestCard, publicQuestion, revealed } from '../lib/answers.js'
import { currentNode, doneIdsOf, nodeStatus } from '../lib/path.js'
import { pointsOf } from '../lib/players.js'
import { withFreshBuoys } from '../lib/reserve.js'

const router = Router()

const NO_BUOYS = 'Tu n’as plus de bouée. Elles se regonflent cette nuit, ou à la boutique.'

function lessonOrThrow(id) {
  const lesson = lessonContent(id)
  if (!lesson) throw new HttpError(404, 'lesson_not_found', 'Cette leçon n’existe pas.')
  return lesson
}

function publicLesson(lesson) {
  return {
    id: lesson.id,
    kind: lesson.kind,
    title: lesson.title,
    theme: lesson.theme,
    hook: lesson.hook,
    unit: { id: lesson.unit.id, title: lesson.unit.title, color: lesson.unit.color },
    guest: lesson.guest ? guestCard(lesson.guest) : null,
    questions: lesson.questions.map((question) => ({ ...publicQuestion(question), guest: guestCard(question.guest) })),
  }
}

// Où en est la partie : les réponses corrigées, et si la leçon est finie.
function progressOf(lesson, run) {
  const answers = {}
  for (const question of lesson.questions) {
    const entry = run.answers[question.id]
    if (entry) answers[question.id] = revealed(question, entry, Math.round(question.success * 100))
  }
  const answered = Object.keys(answers).length
  return { answers, answered, total: lesson.questions.length, completed: answered === lesson.questions.length }
}

const buoysOf = (player) => ({ count: player.buoys, max: MAX_BUOYS })

// La partie en cours du joueur sur cette leçon, ou null.
const openRun = (playerId, lessonId, client = prisma) =>
  client.lessonRun.findFirst({ where: { playerId, lessonId, completedOn: null }, orderBy: { id: 'desc' } })

router
  .route('/lessons/:id/start')
  .post(async (req, res) => {
    const lesson = lessonOrThrow(req.params.id)
    const day = today()
    // Un visiteur sans compte a son propre chemin : il est créé à sa première leçon.
    const player = await withFreshBuoys(await playerOf(req, res, { create: true }), day)

    const done = await doneIdsOf(player.id)
    const status = nodeStatus(nodeById(lesson.id), done)
    if (status === 'locked') throw new HttpError(403, 'lesson_locked', 'Termine d’abord les étapes précédentes du parcours.')

    let run = await openRun(player.id, lesson.id)
    if (!run) {
      if (player.buoys < 1) throw new HttpError(409, 'no_buoys', NO_BUOYS)
      // Une seule leçon à la fois : commencer celle-ci abandonne celle qui était restée en plan.
      await prisma.lessonRun.deleteMany({ where: { playerId: player.id, completedOn: null } })
      // Une leçon déjà faite se refait : elle ne rapporte plus rien, mais entraîne.
      run = await prisma.lessonRun.create({ data: { playerId: player.id, lessonId: lesson.id, firstTime: status !== 'done' } })
    }
    res.json({ lesson: publicLesson(lesson), progress: progressOf(lesson, run), replay: !run.firstTime, buoys: buoysOf(player) })
  })
  .all(methodNotAllowed)

router
  .route('/lessons/:id/answers')
  .post(async (req, res) => {
    const lesson = lessonOrThrow(req.params.id)
    const day = today()
    const player = await playerOf(req, res)
    const started = player && (await openRun(player.id, lesson.id))
    if (!started) throw new HttpError(409, 'lesson_not_started', 'Cette leçon n’est pas commencée.')

    const question = lesson.questions.find((q) => q.id === req.body?.questionId)
    if (!question) throw new HttpError(404, 'question_not_found', 'Cette question ne fait pas partie de la leçon.')
    const correct = checkAnswer(question, req.body.answer)
    const entry = { answer: req.body.answer, correct }

    // Tout se passe dans une transaction qui verrouille la partie : deux réponses envoyées en même
    // temps ne peuvent ni se perdre, ni coûter deux fois la même bouée.
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LessonRun" WHERE id = ${started.id} FOR UPDATE`
      const run = await tx.lessonRun.findUnique({ where: { id: started.id } })
      if (run.completedOn) throw new HttpError(409, 'lesson_not_started', 'Cette leçon n’est pas commencée.')
      if (run.answers[question.id]) throw new HttpError(409, 'already_answered', 'Tu as déjà répondu à cette question.')
      const fresh = await withFreshBuoys(await tx.player.findUnique({ where: { id: player.id } }), day, tx)
      if (fresh.buoys < 1) throw new HttpError(409, 'no_buoys', NO_BUOYS)

      const answers = { ...run.answers, [question.id]: entry }
      let updated = await tx.lessonRun.update({ where: { id: run.id }, data: { answers } })
      // Une erreur coûte une bouée.
      let buoys = fresh
      if (!correct) buoys = await tx.player.update({ where: { id: fresh.id }, data: { buoys: { decrement: 1 } } })

      if (Object.keys(answers).length === lesson.questions.length) {
        // Fin de la leçon : points et sardines, la première fois seulement.
        const right = lesson.questions.filter((q) => answers[q.id].correct).length
        const points = run.firstTime ? lessonPoints(right, lesson.questions.length, { review: lesson.kind === 'review' }) : null
        const perfect = right === lesson.questions.length
        const sardines = run.firstTime ? (lesson.kind === 'review' ? SARDINES.review : SARDINES.lesson) + (perfect ? SARDINES.perfect : 0) : 0
        updated = await tx.lessonRun.update({
          where: { id: run.id },
          data: { correct: right, points: points ? points.total : null, sardines, completedOn: toDbDate(day) },
        })
        if (sardines) await tx.player.update({ where: { id: fresh.id }, data: { sardines: { increment: sardines } } })
      }
      return { run: updated, buoys }
    })

    const state = progressOf(lesson, outcome.run)
    res.json({
      ...state.answers[question.id],
      progress: { answered: state.answered, total: state.total, completed: state.completed },
      buoys: buoysOf(outcome.buoys),
    })
  })
  .all(methodNotAllowed)

router
  .route('/lessons/:id/result')
  .get(async (req, res) => {
    const lesson = lessonOrThrow(req.params.id)
    const player = await playerOf(req, res)
    const run = player && (await prisma.lessonRun.findFirst({ where: { playerId: player.id, lessonId: lesson.id }, orderBy: { id: 'desc' } }))
    if (!run?.completedOn) throw new HttpError(409, 'not_finished', 'Réponds à toutes les questions pour voir le bilan de la leçon.')

    const total = lesson.questions.length
    const correct = run.correct
    const points = run.firstTime ? lessonPoints(correct, total, { review: lesson.kind === 'review' }) : null
    const now = await pointsOf(player.id)
    const before = now - (run.points ?? 0)
    const next = currentNode(await doneIdsOf(player.id))
    res.json({
      id: lesson.id,
      kind: lesson.kind,
      title: lesson.title,
      unit: { id: lesson.unit.id, title: lesson.unit.title, color: lesson.unit.color },
      correct,
      total,
      firstTime: run.firstTime,
      points,
      sardines: run.sardines ?? 0,
      moral: lesson.moral,
      reflexes: lesson.reflexes,
      sources: lesson.sources || [],
      player:
        player.username || run.firstTime
          ? { before: { points: before, stage: stageFor(before) }, after: { points: now, stage: stageFor(now) } }
          : null,
      quests: [],
      next: next ? { type: next.type, id: next.id, title: next.type === 'chest' ? 'Coffre' : lessonContent(next.id).title } : null,
    })
  })
  .all(methodNotAllowed)

export default router
