// Le classement (CONTRAT.md, « Le classement »). Lancer avec `npm test`.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, browser, cleanUp } from './helpers.js'

let server

before(async () => {
  server = await startServer()
})

after(async () => {
  await server.close()
  await cleanUp()
})

const DEMO_PASSWORD = 'banquise-sardine-parapluie'

test('classement de la semaine, sans session : 10 premiers, triés, sans « me »', async () => {
  const { status, body } = await browser(server.base).call('GET', '/leaderboard')
  assert.equal(status, 200)
  assert.equal(body.period, 'week')
  assert.equal(body.top.length, 10)
  assert.equal(body.me, null)
  assert.deepEqual(body.around, [])
  assert.ok(body.players >= 10)
  for (let i = 1; i < body.top.length; i++) assert.ok(body.top[i - 1].points >= body.top[i].points)
  // À points égaux, même rang ; sinon le rang est la position.
  body.top.forEach((row, i) => {
    const same = i > 0 && body.top[i - 1].points === row.points
    assert.equal(row.rank, same ? body.top[i - 1].rank : i + 1)
    assert.equal(row.me, false)
  })
  assert.equal(body.to >= body.from, true)
})

test('classement de toujours : depuis le lancement', async () => {
  const { status, body } = await browser(server.base).call('GET', '/leaderboard?period=all')
  assert.equal(status, 200)
  assert.equal(body.period, 'all')
  assert.equal(body.from, '2026-10-21')
})

test('une période inconnue : 400 invalid_period', async () => {
  const { status, body } = await browser(server.base).call('GET', '/leaderboard?period=mois')
  assert.equal(status, 400)
  assert.equal(body.error.code, 'invalid_period')
})

test('connecté, on se retrouve dans le classement avec l’écart avec celui de devant', async () => {
  const b = browser(server.base)
  await b.call('POST', '/auth/login', { username: 'sacha_31', password: DEMO_PASSWORD })
  const { status, body } = await b.call('GET', '/leaderboard?period=all')
  assert.equal(status, 200)
  assert.equal(body.me.username, 'sacha_31')
  assert.equal(body.me.me, true)
  const listed = [...body.top, ...body.around].filter((row) => row.me)
  assert.equal(listed.length, 1)
  assert.equal(listed[0].rank, body.me.rank)
  if (body.me.ahead) {
    assert.ok(body.me.ahead.gap > 0)
    assert.ok(body.me.ahead.rank < body.me.rank)
  }
  assert.ok(body.me.next.maxPoints > 0)
})

test('un autre verbe que GET : 405', async () => {
  const { status } = await browser(server.base).call('POST', '/leaderboard', {})
  assert.equal(status, 405)
})
