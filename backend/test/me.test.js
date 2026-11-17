// Le joueur connecté (CONTRAT.md, « Le joueur connecté »). Lancer avec `npm test`.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../prisma.js'
import { startServer, browser, testName, cleanUp, STRONG_PASSWORD } from './helpers.js'

let server

before(async () => {
  server = await startServer()
})

after(async () => {
  await server.close()
  await cleanUp()
})

const DEMO_PASSWORD = 'banquise-sardine-parapluie'

async function newPlayer(label = 'moi') {
  const b = browser(server.base)
  const username = testName(label)
  const signup = await b.call('POST', '/auth/signup', { username, password: STRONG_PASSWORD })
  assert.equal(signup.status, 201)
  return { b, username }
}

test('toutes les routes « connecté » répondent 401 sans session', async () => {
  const b = browser(server.base)
  for (const [method, path] of [['GET', '/me'], ['PATCH', '/me'], ['PUT', '/me/password'], ['DELETE', '/me']]) {
    const { status, body } = await b.call(method, path, method === 'GET' ? undefined : {})
    assert.equal(status, 401, `${method} ${path}`)
    assert.equal(body.error.code, 'not_authenticated')
  }
})

test('GET /me : Mon Tux d’un compte de démonstration', async () => {
  const b = browser(server.base)
  await b.call('POST', '/auth/login', { username: 'sacha_31', password: DEMO_PASSWORD })
  const { status, body } = await b.call('GET', '/me')
  assert.equal(status, 200)
  assert.equal(body.user.username, 'sacha_31')
  assert.ok(body.points > 0)
  assert.equal(body.stage.level >= 0, true)
  assert.ok(body.stage.motto)
  assert.ok(body.streak.current > 0)
  assert.ok(body.streak.best >= body.streak.current)
  assert.equal(body.week.length, 7)
  assert.equal(body.days.length, 28)
  assert.equal(body.days.at(-1).date, body.week.at(-1).date)
  assert.equal(body.achievements.length, 5)
  assert.ok(body.rank.all.position >= 1)
  assert.ok(body.totals.correct <= body.totals.questions)
  assert.equal(body.days.filter((day) => day.status === 'played').length, body.totals.episodes)
  const weekPoints = body.week.reduce((sum, day) => sum + day.points, 0)
  assert.ok(weekPoints > 0)
})

test('GET /me : un compte neuf a des zéros, pas de classement', async () => {
  const { b } = await newPlayer()
  const { status, body } = await b.call('GET', '/me')
  assert.equal(status, 200)
  assert.equal(body.points, 0)
  assert.equal(body.stage.level, 0)
  assert.equal(body.rank.week, null)
  assert.equal(body.rank.all, null)
  assert.deepEqual(body.totals, { episodes: 0, correct: 0, questions: 0, lessons: 0 })
  assert.equal(body.days.at(-1).status, 'today')
  assert.ok(body.achievements.every((achievement) => achievement.level === 0))
})

test('PATCH /me : changer de pseudo, refus expliqués', async () => {
  const { b } = await newPlayer()
  const invalid = await b.call('PATCH', '/me', { username: 'a b' })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.error.code, 'invalid')
  assert.ok(invalid.body.error.fields.username)

  const taken = await b.call('PATCH', '/me', { username: 'SACHA_31' })
  assert.equal(taken.status, 409)
  assert.equal(taken.body.error.code, 'username_taken')
  assert.ok(taken.body.error.fields.username)

  const next = testName('nouveau')
  const ok = await b.call('PATCH', '/me', { username: next })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.username, next)
  assert.equal((await b.call('GET', '/session')).body.user.username, next)
  // Changer la casse de son propre pseudo reste possible.
  const recased = await b.call('PATCH', '/me', { username: next.toUpperCase() })
  assert.equal(recased.status, 200)
})

test('PUT /me/password : changer de mot de passe, puis se reconnecter avec', async () => {
  const { b, username } = await newPlayer()
  const wrong = await b.call('PUT', '/me/password', { currentPassword: 'pas-le-bon', newPassword: 'Une-autre-phrase-solide-2027' })
  assert.equal(wrong.status, 403)
  assert.equal(wrong.body.error.code, 'wrong_password')
  assert.ok(wrong.body.error.fields.currentPassword)

  const weak = await b.call('PUT', '/me/password', { currentPassword: STRONG_PASSWORD, newPassword: 'azerty' })
  assert.equal(weak.status, 400)
  assert.ok(weak.body.error.fields.newPassword)

  const same = await b.call('PUT', '/me/password', { currentPassword: STRONG_PASSWORD, newPassword: STRONG_PASSWORD })
  assert.equal(same.status, 400)
  assert.ok(same.body.error.fields.newPassword)

  const newPassword = 'Une-autre-phrase-solide-2027'
  const ok = await b.call('PUT', '/me/password', { currentPassword: STRONG_PASSWORD, newPassword })
  assert.equal(ok.status, 204)
  const stored = await prisma.player.findUnique({ where: { usernameKey: username.toLowerCase() } })
  assert.match(stored.passwordHash, /^\$2[aby]\$/)

  const other = browser(server.base)
  assert.equal((await other.call('POST', '/auth/login', { username, password: STRONG_PASSWORD })).status, 401)
  assert.equal((await other.call('POST', '/auth/login', { username, password: newPassword })).status, 200)
})

test('DELETE /me : supprime le compte et ses parties, ferme la session', async () => {
  const { b, username } = await newPlayer()
  const wrong = await b.call('DELETE', '/me', { password: 'pas-le-bon' })
  assert.equal(wrong.status, 403)
  assert.equal(wrong.body.error.code, 'wrong_password')
  assert.ok(wrong.body.error.fields.password)

  const account = await prisma.player.findUnique({ where: { usernameKey: username.toLowerCase() } })
  await prisma.lessonRun.create({ data: { playerId: account.id, lessonId: 'adresse-piegee', firstTime: true } })

  const ok = await b.call('DELETE', '/me', { password: STRONG_PASSWORD })
  assert.equal(ok.status, 204)
  assert.equal(await prisma.player.findUnique({ where: { id: account.id } }), null)
  assert.equal(await prisma.lessonRun.count({ where: { playerId: account.id } }), 0)
  assert.deepEqual((await b.call('GET', '/session')).body, { user: null })
})
