// Comptes et session (CONTRAT.md, « Comptes et session »). Lancer avec `npm test`.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import prisma from '../prisma.js'
import { startServer, browser, testName, cleanUp, STRONG_PASSWORD } from './helpers.js'
import { today, toDbDate } from '../lib/dates.js'

let server

before(async () => {
  server = await startServer()
})

after(async () => {
  await server.close()
  await cleanUp()
})

test('sans session, personne n’est connecté', async () => {
  const { status, body } = await browser(server.base).call('GET', '/session')
  assert.equal(status, 200)
  assert.deepEqual(body, { user: null })
})

test('les erreurs ont toujours la même forme', async () => {
  const b = browser(server.base)
  const missing = await b.call('GET', '/pas-de-route')
  assert.equal(missing.status, 404)
  assert.equal(missing.body.error.code, 'route_not_found')
  const wrongMethod = await b.call('DELETE', '/session')
  assert.equal(wrongMethod.status, 405)
  assert.equal(wrongMethod.body.error.code, 'method_not_allowed')
})

test('inscription : refus expliqués, champ par champ', async () => {
  const b = browser(server.base)
  const { status, body } = await b.call('POST', '/auth/signup', { username: 'a b', password: 'azerty' })
  assert.equal(status, 400)
  assert.equal(body.error.code, 'invalid')
  assert.ok(body.error.fields.username)
  assert.ok(body.error.fields.password)
})

test('inscription, session, déconnexion et reconnexion', async () => {
  const b = browser(server.base)
  const username = testName('tux')
  const signup = await b.call('POST', '/auth/signup', { username, password: STRONG_PASSWORD })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.user.username, username)
  assert.equal(signup.body.user.points, 0)
  assert.equal(signup.body.claimed, null)
  // Le jeton est dans un cookie httpOnly : le JavaScript de la page ne peut pas le lire.
  const cookie = signup.cookies.find((line) => line.startsWith('session='))
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)

  // Le mot de passe est haché par bcrypt, jamais stocké en clair.
  const stored = await prisma.player.findUnique({ where: { usernameKey: username.toLowerCase() } })
  assert.match(stored.passwordHash, /^\$2[aby]\$10\$/)

  assert.equal((await b.call('GET', '/session')).body.user.username, username)
  assert.equal((await b.call('POST', '/auth/logout')).status, 204)
  assert.equal((await b.call('GET', '/session')).body.user, null)

  // Le pseudo est unique sans tenir compte des majuscules.
  const taken = await browser(server.base).call('POST', '/auth/signup', { username: username.toUpperCase(), password: STRONG_PASSWORD })
  assert.equal(taken.status, 409)
  assert.equal(taken.body.error.code, 'username_taken')

  const login = await b.call('POST', '/auth/login', { username: username.toUpperCase(), password: STRONG_PASSWORD })
  assert.equal(login.status, 200)
  assert.equal(login.body.user.username, username)
})

test('connexion : même réponse que le pseudo existe ou non', async () => {
  const b = browser(server.base)
  const unknown = await b.call('POST', '/auth/login', { username: testName('fantome'), password: 'nimporte' })
  assert.equal(unknown.status, 401)
  assert.equal(unknown.body.error.code, 'bad_credentials')
})

test('connexion : après 5 échecs, il faut attendre', async () => {
  const b = browser(server.base)
  const username = testName('devin')
  for (let i = 0; i < 5; i++) {
    assert.equal((await b.call('POST', '/auth/login', { username, password: `essai-${i}` })).status, 401)
  }
  const locked = await b.call('POST', '/auth/login', { username, password: 'essai-6' })
  assert.equal(locked.status, 429)
  assert.equal(locked.body.error.code, 'too_many_attempts')
  assert.ok(locked.body.error.fields.retryAfter > 100)
})

test('un faux jeton ne vaut rien', async () => {
  const b = browser(server.base)
  b.jar.set('session', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature-inventee')
  assert.equal((await b.call('GET', '/session')).body.user, null)
})

test('à l’inscription, l’épisode du jour joué sans compte rejoint le compte', async () => {
  const day = today()
  const episode = await prisma.episode.findUnique({ where: { date: toDbDate(day) }, include: { mission: true } })
  assert.ok(episode, 'pas d’épisode aujourd’hui : lancer `npm run seed`')
  const questions = episode.mission.questions

  // Un visiteur qui a fini l'épisode du jour sans faute, sans compte.
  const token = crypto.randomBytes(24).toString('base64url')
  await prisma.player.create({
    data: {
      guestToken: token,
      createdOn: toDbDate(day),
      attempts: {
        create: {
          date: toDbDate(day),
          mode: 'guest',
          completedAt: new Date(),
          answers: { create: questions.map((q) => ({ questionId: q.id, value: q.answer, correct: true })) },
        },
      },
    },
  })

  const b = browser(server.base)
  b.jar.set('visiteur', token)
  const username = testName('rattrape')
  const signup = await b.call('POST', '/auth/signup', { username, password: STRONG_PASSWORD })
  assert.equal(signup.status, 201)
  // 10 par bonne réponse, 10 pour le sans-faute, 2 pour le premier jour de série.
  const expected = questions.length * 10 + 10 + 2
  assert.deepEqual(signup.body.claimed, { date: day, answered: questions.length, completed: true, points: expected })
  assert.equal(signup.body.user.points, expected)
  assert.deepEqual(signup.body.user.streak, { current: 1, playedToday: true })
  assert.equal(b.jar.has('visiteur'), false)
})
