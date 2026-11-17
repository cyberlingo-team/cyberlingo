// Chemin, guides et coffres : voir « Le parcours, la réserve et les quêtes » dans CONTRAT.md.

import { Router } from 'express'
import prisma from '../prisma.js'
import { HttpError, methodNotAllowed } from '../lib/errors.js'
import { playerOf } from '../lib/session.js'
import { today, toDbDate, fromDbDate } from '../lib/dates.js'
import { inventoryOf } from './inventory.js'
import { GANG, NODES, UNITS, CHEST_AFTER, SARDINES, lessonContent, unitById, nodeById, lessonPoints, missionPoints } from '../lib/content.js'

const router = Router()

function guestCard(id) {
  const guest = GANG[id]
  return guest ? { id: guest.id, name: guest.name, tagline: guest.tagline, look: guest.look } : null
}

function doneSet(runs, chests) {
  return new Set([...runs.map((run) => run.lessonId), ...chests.map((chest) => chest.chestId)])
}

function currentNode(done) {
  return NODES.find((node) => !done.has(node.id)) || null
}

function statusOf(node, done, current) {
  if (done.has(node.id)) return 'done'
  return current?.id === node.id ? 'current' : 'locked'
}

async function progressFor(playerId) {
  const [runs, chests] = await Promise.all([
    prisma.lessonRun.findMany({ where: { playerId, completedOn: { not: null } }, orderBy: { startedAt: 'asc' } }),
    prisma.chestOpening.findMany({ where: { playerId }, select: { chestId: true } }),
  ])
  return { runs, chests, done: doneSet(runs, chests) }
}

async function dailyCard(player, day) {
  const episode = await prisma.episode.findUnique({ where: { date: toDbDate(day) }, include: { mission: true } })
  if (!episode) throw new HttpError(404, 'mission_not_found', 'Aucun épisode ce jour-là.')
  const attempt = await prisma.attempt.findUnique({ where: { playerId_date: { playerId: player.id, date: toDbDate(day) } }, include: { answers: true } })
  const answered = attempt?.answers.length ?? 0
  const total = episode.mission.questions.length
  const inventory = await inventoryOf(player, day)
  const played = attempt?.mode === 'counted' && attempt.completedAt
  const guest = guestCard(episode.mission.guest)
  return {
    date: day,
    number: episode.number,
    title: episode.mission.title,
    theme: episode.mission.theme,
    hook: episode.mission.hook,
    guest,
    status: played || answered === total ? 'done' : answered ? 'started' : 'todo',
    answered,
    total,
    points: played ? attempt.points : null,
    maxPoints: missionPoints(total, total, inventory.streak.current + (played ? 0 : 1)).total,
    players: await prisma.attempt.count({ where: { date: toDbDate(day) } }),
  }
}

router.route('/path').get(async (req, res) => {
  const player = await playerOf(req, res, { create: true })
  const day = today()
  const [progress, daily] = await Promise.all([progressFor(player.id), dailyCard(player, day)])
  const current = currentNode(progress.done)
  const units = UNITS.map((unit, index) => {
    const nodes = NODES.filter((node) => node.unit === unit.id).map((node) => {
      const lesson = node.type === 'chest' ? null : lessonContent(node.id)
      const completed = progress.runs.filter((run) => run.lessonId === node.id)
      const best = completed.reduce((result, run) => !result || (run.correct ?? 0) > (result.correct ?? 0) ? run : result, null)
      return {
        type: node.type,
        id: node.id,
        title: node.type === 'chest' ? 'Coffre' : lesson.title,
        ...(node.type === 'lesson' ? { guest: guestCard(lesson.guest) } : {}),
        status: statusOf(node, progress.done, current),
        score: node.type === 'chest' ? null : best ? { correct: best.correct, total: lesson.questions.length } : null,
        maxPoints: lesson ? lessonPoints(lesson.questions.length, lesson.questions.length, { review: node.type === 'review' }).total : null,
      }
    })
    return {
      id: unit.id, number: index + 1, title: unit.title, description: unit.description,
      color: unit.color, villain: unit.villain,
      status: nodes.every((node) => node.status === 'done') ? 'done' : nodes.some((node) => node.status !== 'locked') ? 'current' : 'locked',
      nodes,
    }
  })
  const lessons = NODES.filter((node) => node.type !== 'chest')
  res.json({
    daily,
    units,
    current: current ? { type: current.type, id: current.id, unit: current.unit } : null,
    lessons: { done: lessons.filter((node) => progress.done.has(node.id)).length, total: lessons.length },
  })
}).all(methodNotAllowed)

router.route('/units/:id/guide').get((req, res) => {
  const unit = unitById(req.params.id)
  if (!unit) throw new HttpError(404, 'unit_not_found', 'Ce thème n’existe pas.')
  const review = lessonContent(`bilan-${unit.id}`)
  res.json({
    unit: { id: unit.id, number: UNITS.indexOf(unit) + 1, title: unit.title, description: unit.description, color: unit.color, villain: unit.villain },
    reflexes: review.reflexes,
    sources: unit.missions.flatMap((id) => lessonContent(id).sources || []).filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index),
  })
}).all(methodNotAllowed)

router.route('/path/chests/:id').post(async (req, res) => {
  const node = nodeById(req.params.id)
  if (!node || node.type !== 'chest') throw new HttpError(404, 'chest_not_found', 'Ce coffre n’existe pas.')
  const player = await playerOf(req, res, { create: true })
  const progress = await progressFor(player.id)
  const current = currentNode(progress.done)
  if (progress.done.has(node.id)) throw new HttpError(409, 'already_claimed', 'Tu as déjà ouvert ce coffre.')
  if (current?.id !== node.id) throw new HttpError(403, 'chest_locked', 'Termine d’abord les leçons qui mènent à ce coffre.')

  try {
    await prisma.$transaction(async (tx) => {
      await tx.chestOpening.create({ data: { playerId: player.id, chestId: node.id, openedOn: toDbDate(today()) } })
      await tx.player.update({ where: { id: player.id }, data: { sardines: { increment: SARDINES.chest } } })
    })
  } catch (error) {
    if (error?.code === 'P2002') throw new HttpError(409, 'already_claimed', 'Tu as déjà ouvert ce coffre.')
    throw error
  }
  const updated = await prisma.player.findUniqueOrThrow({ where: { id: player.id } })
  res.json({ sardines: SARDINES.chest, inventory: await inventoryOf(updated) })
}).all(methodNotAllowed)

export default router
