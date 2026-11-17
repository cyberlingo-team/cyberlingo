// Routes de lecture des épisodes : les réponses et explications restent privées jusqu'au jeu.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { browser, cleanUp, startServer } from './helpers.js'
import prisma from '../prisma.js'

let server
let guestToken

before(async () => {
  server = await startServer()
})

after(async () => {
  await server.close()
  if (guestToken) await prisma.player.deleteMany({ where: { guestToken } })
  await cleanUp()
})

test('GET /api/missions/today ne révèle pas les solutions', async () => {
  const response = await browser(server.base).call('GET', '/missions/today')
  assert.equal(response.status, 200)
  assert.ok(response.body.mission.questions.length > 0)
  for (const cookie of response.cookies) {
    const match = cookie.match(/^visiteur=([^;]+)/)
    if (match) guestToken = match[1]
  }
  for (const question of response.body.mission.questions) {
    assert.equal(Object.hasOwn(question, 'answer'), false)
    assert.equal(Object.hasOwn(question, 'explanation'), false)
  }
})
