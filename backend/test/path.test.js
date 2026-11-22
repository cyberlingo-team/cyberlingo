// Chemin, guides et coffres (CONTRAT.md).

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../prisma.js'
import { startServer, browser, testName, cleanUp, STRONG_PASSWORD } from './helpers.js'
import { toDbDate, today } from '../lib/dates.js'
import { UNITS, CHEST_AFTER } from '../lib/content.js'

let server

before(async () => { server = await startServer() })
after(async () => { await server.close(); await cleanUp() })

test('GET /api/path renvoie la mission et les étapes verrouillées', async () => {
  const { status, body } = await browser(server.base).call('GET', '/path')
  assert.equal(status, 200)
  assert.ok(body.daily.title)
  assert.equal(body.units.length, UNITS.length)
  assert.equal(body.current.type, 'lesson')
  assert.equal(body.units[0].nodes[0].status, 'current')
})

test('GET /api/units/:id/guide présente les réflexes et les sources', async () => {
  const { status, body } = await browser(server.base).call('GET', '/units/hameconnage/guide')
  assert.equal(status, 200)
  assert.equal(body.unit.id, 'hameconnage')
  assert.ok(body.reflexes.length > 0)
  assert.ok(body.sources.every((source) => source.url.startsWith('https://')))
  const missing = await browser(server.base).call('GET', '/units/inconnu/guide')
  assert.equal(missing.body.error.code, 'unit_not_found')
})

test('un coffre s’ouvre après les leçons requises et ne paie qu’une fois', async () => {
  const b = browser(server.base)
  const username = testName('coffre')
  assert.equal((await b.call('POST', '/auth/signup', { username, password: STRONG_PASSWORD })).status, 201)
  const player = await prisma.player.findUnique({ where: { usernameKey: username.toLowerCase() } })
  const day = toDbDate(today())
  await prisma.lessonRun.createMany({ data: UNITS[0].missions.slice(0, CHEST_AFTER).map((lessonId) => ({ playerId: player.id, lessonId, firstTime: true, correct: 3, completedOn: day })) })

  const opened = await b.call('POST', '/path/chests/coffre-hameconnage')
  assert.equal(opened.status, 200)
  assert.equal(opened.body.sardines, 20)
  assert.equal(opened.body.inventory.sardines, 120)
  const repeated = await b.call('POST', '/path/chests/coffre-hameconnage')
  assert.equal(repeated.status, 409)
  assert.equal(repeated.body.error.code, 'already_claimed')
})
