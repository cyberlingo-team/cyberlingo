// Règles du jeu et personnages (CONTRAT.md, « Les règles du jeu et les personnages »).

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

test('GET /api/game : huit stades et le barème', async () => {
  const { status, body } = await browser(server.base).call('GET', '/game')
  assert.equal(status, 200)
  assert.equal(body.stages.length, 8)
  assert.deepEqual(body.scoring, { correctAnswer: 10, perfectBonus: 10, streakBonusPerDay: 2, streakBonusMaxDays: 10 })
})

test('GET /api/cast : douze personnages et Léopold', async () => {
  const { status, body } = await browser(server.base).call('GET', '/cast')
  assert.equal(status, 200)
  assert.equal(body.gang.length, 12)
  assert.equal(body.villain.name, 'Léopold')
  assert.ok(body.villain.disguises.every((d) => d.id && d.label))
})
