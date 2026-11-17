// Jouer une leçon du chemin (CONTRAT.md, « Le parcours, la réserve et les quêtes »).
// Lancer avec `npm test`.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../prisma.js'
import { startServer, browser, testName, cleanUp, STRONG_PASSWORD } from './helpers.js'
import { NODES, lessonContent, lessonPoints, SARDINES, MAX_BUOYS } from '../lib/content.js'

let server

before(async () => {
  server = await startServer()
})

after(async () => {
  await server.close()
  await cleanUp()
})

const FIRST = NODES[0].id // la première leçon du chemin
const SECOND = NODES[1].id
const LOCKED = NODES[3].id // derrière le coffre

// Une réponse fausse, d'après la solution de la question.
function wrongAnswer(question) {
  switch (question.kind) {
    case 'trap':
      return question.answer === 'trap' ? 'safe' : 'trap'
    case 'truefalse':
      return !question.answer
    case 'choice':
      return question.options.find((option) => option.id !== question.answer).id
    default:
      return null // « Passer » : compte comme une erreur
  }
}

const rightAnswer = (question) => question.answer

async function newAccount() {
  const b = browser(server.base)
  const username = testName('lecon')
  assert.equal((await b.call('POST', '/auth/signup', { username, password: STRONG_PASSWORD })).status, 201)
  return { b, username }
}

test('la leçon à jouer : sans la solution des questions', async () => {
  const { b } = await newAccount()
  const { status, body } = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(status, 200)
  assert.equal(body.lesson.id, FIRST)
  assert.equal(body.replay, false)
  assert.equal(body.progress.answered, 0)
  assert.equal(body.buoys.count, MAX_BUOYS)
  const text = JSON.stringify(body.lesson)
  assert.ok(body.lesson.questions.length > 0)
  for (const question of body.lesson.questions) {
    assert.equal('answer' in question, false)
    assert.equal('explanation' in question, false)
  }
  assert.equal(text.includes('"solution"'), false)
})

test('erreurs : leçon inconnue, étape verrouillée, pas commencée, mauvaise question', async () => {
  const { b } = await newAccount()
  assert.equal((await b.call('POST', '/lessons/nimporte-quoi/start')).body.error.code, 'lesson_not_found')
  assert.equal((await b.call('GET', '/lessons/nimporte-quoi/result')).body.error.code, 'lesson_not_found')
  // Un coffre n'est pas une leçon.
  assert.equal((await b.call('POST', `/lessons/${NODES[2].id}/start`)).body.error.code, 'lesson_not_found')

  const locked = await b.call('POST', `/lessons/${LOCKED}/start`)
  assert.equal(locked.status, 403)
  assert.equal(locked.body.error.code, 'lesson_locked')

  const early = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: 'x', answer: 'trap' })
  assert.equal(early.status, 409)
  assert.equal(early.body.error.code, 'lesson_not_started')

  const unfinished = await b.call('GET', `/lessons/${FIRST}/result`)
  assert.equal(unfinished.status, 409)
  assert.equal(unfinished.body.error.code, 'not_finished')

  await b.call('POST', `/lessons/${FIRST}/start`)
  const unknown = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: 'inconnue', answer: 'trap' })
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body.error.code, 'question_not_found')

  const question = lessonContent(FIRST).questions[0]
  const badShape = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: question.id, answer: { n: 1 } })
  assert.equal(badShape.status, 400)
  assert.equal(badShape.body.error.code, 'invalid_answer')
})

test('une leçon de bout en bout : une bouée perdue, points, sardines, étape suivante', async () => {
  const { b, username } = await newAccount()
  const lesson = lessonContent(FIRST)
  const before = (await b.call('GET', '/session')).body.user.points
  assert.equal(before, 0)

  await b.call('POST', `/lessons/${FIRST}/start`)
  let last
  for (const [i, question] of lesson.questions.entries()) {
    // Une seule erreur : la première question.
    const answer = i === 0 ? wrongAnswer(question) : rightAnswer(question)
    last = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: question.id, answer })
    assert.equal(last.status, 200)
    assert.equal(last.body.correct, i !== 0)
    assert.ok(last.body.explanation)
    assert.equal(last.body.progress.answered, i + 1)
    assert.equal(last.body.buoys.count, MAX_BUOYS - 1)
    if (i === 0) {
      const again = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: question.id, answer })
      assert.equal(again.status, 409)
      assert.equal(again.body.error.code, 'already_answered')
    }
  }
  assert.equal(last.body.progress.completed, true)

  const total = lesson.questions.length
  const result = await b.call('GET', `/lessons/${FIRST}/result`)
  assert.equal(result.status, 200)
  const expected = lessonPoints(total - 1, total)
  assert.equal(result.body.correct, total - 1)
  assert.equal(result.body.total, total)
  assert.equal(result.body.firstTime, true)
  assert.deepEqual(result.body.points, expected)
  assert.equal(result.body.sardines, SARDINES.lesson) // pas de sans-faute, pas de bonus
  assert.equal(result.body.player.before.points, 0)
  assert.equal(result.body.player.after.points, expected.total)
  assert.equal(result.body.next.id, SECOND)
  assert.deepEqual(result.body.quests, [])

  // Les points comptent pour le joueur, les sardines sont versées, la bouée est perdue.
  assert.equal((await b.call('GET', '/session')).body.user.points, expected.total)
  const stored = await prisma.player.findUnique({ where: { usernameKey: username.toLowerCase() } })
  assert.equal(stored.sardines, 100 + SARDINES.lesson)
  assert.equal(stored.buoys, MAX_BUOYS - 1)

  // L'étape suivante est débloquée ; la leçon finie, elle, se rejoue sans rien rapporter.
  assert.equal((await b.call('POST', `/lessons/${SECOND}/start`)).status, 200)
  const replay = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(replay.body.replay, true)
  assert.equal(replay.body.progress.answered, 0)
})

test('rejouer une leçon : rien de plus, une partie en cours se reprend', async () => {
  const { b, username } = await newAccount()
  const lesson = lessonContent(FIRST)
  await b.call('POST', `/lessons/${FIRST}/start`)
  for (const question of lesson.questions) await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: question.id, answer: rightAnswer(question) })
  const first = (await b.call('GET', `/lessons/${FIRST}/result`)).body
  assert.equal(first.points.perfect > 0, true)
  assert.equal(first.sardines, SARDINES.lesson + SARDINES.perfect)

  const replay = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(replay.body.replay, true)
  const [one, ...rest] = lesson.questions
  await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: one.id, answer: rightAnswer(one) })
  // Quitter puis revenir : la même partie reprend là où on l'avait laissée.
  const resumed = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(resumed.body.progress.answered, 1)
  for (const question of rest) await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: question.id, answer: rightAnswer(question) })

  const result = (await b.call('GET', `/lessons/${FIRST}/result`)).body
  assert.equal(result.firstTime, false)
  assert.equal(result.points, null)
  assert.equal(result.sardines, 0)
  const stored = await prisma.player.findUnique({ where: { usernameKey: username.toLowerCase() } })
  assert.equal(stored.sardines, 100 + SARDINES.lesson + SARDINES.perfect)
  assert.equal((await b.call('GET', '/session')).body.user.points, first.points.total)
})

test('sans bouée, on ne peut ni commencer ni répondre', async () => {
  const { b, username } = await newAccount()
  const lesson = lessonContent(FIRST)
  await b.call('POST', `/lessons/${FIRST}/start`)
  await prisma.player.update({ where: { usernameKey: username.toLowerCase() }, data: { buoys: 1 } })
  // La dernière bouée part avec une erreur…
  const [one, two] = lesson.questions
  const miss = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: one.id, answer: wrongAnswer(one) })
  assert.equal(miss.status, 200)
  assert.equal(miss.body.buoys.count, 0)
  // …et plus aucune réponse n'est acceptée.
  const blocked = await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: two.id, answer: rightAnswer(two) })
  assert.equal(blocked.status, 409)
  assert.equal(blocked.body.error.code, 'no_buoys')
  // Une autre leçon ne peut pas être commencée non plus (la première, elle, se reprend).
  const other = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(other.status, 200)
  await prisma.lessonRun.deleteMany({ where: { player: { usernameKey: username.toLowerCase() } } })
  const none = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(none.status, 409)
  assert.equal(none.body.error.code, 'no_buoys')
})

test('un visiteur sans compte joue sa leçon ; il n’a pas de bilan « joueur » à la rejouer', async () => {
  const b = browser(server.base)
  const lesson = lessonContent(FIRST)
  const start = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(start.status, 200)
  assert.ok(b.jar.get('visiteur'))
  for (const question of lesson.questions) await b.call('POST', `/lessons/${FIRST}/answers`, { questionId: question.id, answer: rightAnswer(question) })
  const result = await b.call('GET', `/lessons/${FIRST}/result`)
  assert.equal(result.status, 200)
  assert.equal(result.body.firstTime, true)
  assert.ok(result.body.player.after.points > 0)
  const guest = await prisma.player.findUnique({ where: { guestToken: b.jar.get('visiteur') } })
  await prisma.player.delete({ where: { id: guest.id } })
})

test('un compte de démonstration continue là où en est son chemin', async () => {
  const b = browser(server.base)
  await b.call('POST', '/auth/login', { username: 'sacha_31', password: 'banquise-sardine-parapluie' })
  const { status, body } = await b.call('POST', `/lessons/${FIRST}/start`)
  assert.equal(status, 200)
  assert.equal(body.replay, true) // sacha_31 a déjà fini cette leçon
  await prisma.lessonRun.deleteMany({ where: { player: { usernameKey: 'sacha_31' }, completedOn: null } })
})
