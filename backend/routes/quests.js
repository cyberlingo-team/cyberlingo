// Quêtes quotidiennes et défi mensuel, calculés depuis les activités enregistrées.

import { Router } from 'express'
import prisma from '../prisma.js'
import { methodNotAllowed } from '../lib/errors.js'
import { playerOf } from '../lib/session.js'
import { today, toDbDate, fromDbDate, dayNumber } from '../lib/dates.js'
import { lessonContent } from '../lib/content.js'

const router = Router()
const DEFINITIONS = {
  daily: { title: 'Fais la mission du jour', goal: 1, reward: 15 },
  points: { title: 'Gagne 40 points', goal: 40, reward: 10 },
  lessons: { title: 'Termine 2 leçons du parcours', goal: 2, reward: 15 },
  correct: { title: 'Donne 12 bonnes réponses', goal: 12, reward: 10 },
  perfect: { title: 'Fais un sans-faute', goal: 1, reward: 20 },
}
const ROTATING = ['points', 'lessons', 'correct', 'perfect']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MONTHLY_GOAL = 120
const MONTHLY_REWARD = 50

function questIds(date) {
  const index = ((dayNumber(date) % ROTATING.length) + ROTATING.length) % ROTATING.length
  return ['daily', ROTATING[index], ROTATING[(index + 1) % ROTATING.length]]
}

async function activity(playerId, from, through, currentDay) {
  const [attempts, lessons] = await Promise.all([
    prisma.attempt.findMany({ where: { playerId, date: { gte: toDbDate(from), lte: toDbDate(through) }, completedAt: { not: null } }, include: { answers: { select: { correct: true } } } }),
    prisma.lessonRun.findMany({ where: { playerId, completedOn: { gte: toDbDate(from), lte: toDbDate(through) } }, select: { points: true, correct: true, lessonId: true } }),
  ])
  const total = { points: 0, lessons: lessons.length, correct: 0, perfect: 0, daily: 0 }
  for (const lesson of lessons) {
    total.points += lesson.points ?? 0
    total.correct += lesson.correct ?? 0
    const content = lessonContent(lesson.lessonId)
    if (content && lesson.correct === content.questions.length) total.perfect++
  }
  for (const attempt of attempts) {
    const date = fromDbDate(attempt.date)
    const correct = attempt.answers.filter((answer) => answer.correct).length
    total.points += attempt.points ?? 0
    total.correct += correct
    if (attempt.answers.length > 0 && correct === attempt.answers.length) total.perfect++
    if (date === currentDay) total.daily = 1
  }
  return total
}

function monthLabel(date) {
  const month = Number(date.slice(5, 7))
  return /^[aeiou]/.test(MONTHS[month - 1]) ? `Le défi d’${MONTHS[month - 1]}` : `Le défi de ${MONTHS[month - 1]}`
}

export async function settleQuests(player, date = today()) {
  const month = date.slice(0, 7)
  const [dailyActivity, monthlyActivity] = await Promise.all([
    activity(player.id, date, date, date),
    activity(player.id, `${month}-01`, date, date),
  ])
  const daily = questIds(date).map((id) => {
    const definition = DEFINITIONS[id]
    const value = Math.min(definition.goal, dailyActivity[id])
    return { id, ...definition, value, done: value >= definition.goal }
  })
  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const monthly = {
    id: month, title: monthLabel(date), description: `Donne ${MONTHLY_GOAL} bonnes réponses avant la fin du mois.`,
    value: Math.min(MONTHLY_GOAL, monthlyActivity.correct), goal: MONTHLY_GOAL, reward: MONTHLY_REWARD,
    done: monthlyActivity.correct >= MONTHLY_GOAL, daysLeft: daysInMonth - Number(date.slice(8)),
  }

  const earned = []
  for (const quest of daily.filter((item) => item.done).map((item) => ({ ...item, period: date }))) {
    const credited = await credit(player.id, quest.id, quest.period, quest.reward, date)
    if (credited) earned.push({ id: quest.id, title: quest.title, reward: quest.reward })
  }
  if (monthly.done && await credit(player.id, 'monthly', month, MONTHLY_REWARD, date)) {
    earned.push({ id: month, title: monthly.title, reward: MONTHLY_REWARD })
  }
  return { date, daily, monthly, earned }
}

async function credit(playerId, questId, period, reward, date) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.questReward.create({ data: { playerId, questId, period, reward, doneOn: toDbDate(date) } })
      await tx.player.update({ where: { id: playerId }, data: { sardines: { increment: reward } } })
    })
    return true
  } catch (error) {
    if (error?.code === 'P2002') return false
    throw error
  }
}

router.route('/quests').get(async (req, res) => {
  const player = await playerOf(req, res, { create: true })
  const quests = await settleQuests(player)
  res.json({ date: quests.date, daily: quests.daily, monthly: quests.monthly })
}).all(methodNotAllowed)

export default router
