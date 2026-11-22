// Répondre à un épisode et voir son bilan (CONTRAT.md, « Les épisodes »). Lancer avec `npm test`.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../prisma.js'
import { startServer, browser, testName, cleanUp, STRONG_PASSWORD } from './helpers.js'
import { addDays, fromDbDate, today, toDbDate } from '../lib/dates.js'
import { missionPoints } from '../lib/content.js'

let server
let questions
const guestTokens = []

// Un visiteur sans compte, dont on efface la trace à la fin.
function visitor() {
  const b = browser(server.base)
  const call = b.call
  b.call = async (...args) => {
    const response = await call(...args)
    if (b.jar.has('visiteur') && !guestTokens.includes(b.jar.get('visiteur'))) guestTokens.push(b.jar.get('visiteur'))
    return response
  }
  return b
}

async function signedUp() {
  const b = browser(server.base)
  const signup = await b.call('POST', '/auth/signup', { username: testName('joueur'), password: STRONG_PASSWORD })
  assert.equal(signup.status, 201)
  return b
}

before(async () => {
  server = await startServer()
  const episode = await prisma.episode.findUnique({ where: { date: toDbDate(today()) }, include: { mission: true } })
  assert.ok(episode, 'pas d’épisode aujourd’hui : lancer `npm run seed`')
  questions = episode.mission.questions
})

after(async () => {
  await server.close()
  await prisma.player.deleteMany({ where: { guestToken: { in: guestTokens } } })
  await cleanUp()
})

test('un compte joue l’épisode du jour jusqu’au bilan', async () => {
  const b = await signedUp()
  const day = today()

  // Avant la dernière réponse, pas de bilan.
  assert.equal((await b.call('GET', `/missions/${day}/result`)).body.error.code, 'not_finished')

  for (const [i, question] of questions.entries()) {
    const { status, body } = await b.call('POST', `/missions/${day}/answers`, { questionId: question.id, answer: question.answer })
    assert.equal(status, 200)
    assert.equal(body.correct, true)
    assert.deepEqual(body.solution, question.answer)
    assert.equal(body.explanation, question.explanation)
    assert.equal(typeof body.success, 'number')
    assert.deepEqual(body.progress, { mode: 'counted', answered: i + 1, total: questions.length, completed: i + 1 === questions.length })
  }

  const { status, body } = await b.call('GET', `/missions/${day}/result`)
  assert.equal(status, 200)
  assert.equal(body.mode, 'counted')
  assert.equal(body.correct, questions.length)
  // Premier jour de série : sans-faute et bonus d'un jour.
  assert.deepEqual(body.points, missionPoints(questions.length, questions.length, 1))
  assert.equal(body.player.after.points - body.player.before.points, body.points.total)
  assert.deepEqual(body.player.streak, { current: 1, best: 1 })
  assert.equal(body.rank.period, 'week')
  assert.equal(body.rank.previous, null)
  assert.ok(body.rank.position >= 1 && body.rank.position <= body.rank.players)

  // La série est à jour dans la session.
  assert.deepEqual((await b.call('GET', '/session')).body.user.streak, { current: 1, playedToday: true })
  // Une fois l'épisode clos, on ne rejoue plus.
  const again = await b.call('POST', `/missions/${day}/answers`, { questionId: questions[0].id, answer: questions[0].answer })
  assert.equal(again.status, 409)
  assert.equal(again.body.error.code, 'already_completed')
})

test('réponses refusées : mal formée, en double, question ou date inconnue', async () => {
  const b = visitor()
  const day = today()
  const invalid = await b.call('POST', `/missions/${day}/answers`, { questionId: questions[0].id, answer: { pas: 'une réponse' } })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.error.code, 'invalid_answer')

  const first = await b.call('POST', `/missions/${day}/answers`, { questionId: questions[0].id, answer: questions[0].answer })
  assert.equal(first.status, 200)
  assert.equal(first.body.progress.mode, 'guest')
  const twice = await b.call('POST', `/missions/${day}/answers`, { questionId: questions[0].id, answer: questions[0].answer })
  assert.equal(twice.status, 409)
  assert.equal(twice.body.error.code, 'already_answered')

  const unknown = await b.call('POST', `/missions/${day}/answers`, { questionId: 'pas-une-question', answer: true })
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body.error.code, 'question_not_found')

  const future = await b.call('POST', `/missions/${addDays(day, 1)}/answers`, { questionId: questions[0].id, answer: true })
  assert.equal(future.status, 404)
  assert.equal(future.body.error.code, 'mission_not_found')
})

test('sans compte : le bilan montre ce que l’épisode rapporterait, puis le compte le reprend', async () => {
  const b = visitor()
  const day = today()
  // Une erreur sur la première question, le reste juste.
  for (const [i, question] of questions.entries()) {
    const { status } = await b.call('POST', `/missions/${day}/answers`, { questionId: question.id, answer: i === 0 ? null : question.answer })
    assert.equal(status, 200)
  }
  const { body } = await b.call('GET', `/missions/${day}/result`)
  assert.equal(body.mode, 'guest')
  assert.equal(body.correct, questions.length - 1)
  assert.deepEqual(body.points, missionPoints(questions.length - 1, questions.length, 1))
  assert.equal(body.player, null)
  assert.equal(body.rank, null)

  const signup = await b.call('POST', '/auth/signup', { username: testName('repris'), password: STRONG_PASSWORD })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.claimed.points, body.points.total)
  assert.equal((await b.call('GET', `/missions/${day}/result`)).body.mode, 'counted')
})

test('un épisode passé se rejoue en rattrapage, sans points', async () => {
  const b = await signedUp()
  const past = await prisma.episode.findFirst({ where: { date: { lt: toDbDate(today()) } }, orderBy: { date: 'desc' }, include: { mission: true } })
  const date = fromDbDate(past.date)
  for (const question of past.mission.questions) {
    const { status, body } = await b.call('POST', `/missions/${date}/answers`, { questionId: question.id, answer: question.answer })
    assert.equal(status, 200)
    assert.equal(body.progress.mode, 'practice')
  }
  const { body } = await b.call('GET', `/missions/${date}/result`)
  assert.equal(body.mode, 'practice')
  assert.equal(body.points, null)
  assert.equal((await b.call('GET', '/session')).body.user.points, 0)
})
