// Réserve, boutique et quêtes (CONTRAT.md).

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import prisma from '../prisma.js'
import { startServer, browser, testName, cleanUp, STRONG_PASSWORD } from './helpers.js'

let server

before(async () => { server = await startServer() })
after(async () => { await server.close(); await cleanUp() })

test('GET /api/inventory crée une réserve pour un visiteur', async () => {
  const b = browser(server.base)
  const { status, body } = await b.call('GET', '/inventory')
  assert.equal(status, 200)
  assert.equal(body.sardines, 100)
  assert.deepEqual(body.buoys, { count: 5, max: 5 })
  assert.ok(b.jar.has('visiteur'))
})

test('la boutique est réservée aux comptes et un achat débite le bon prix', async () => {
  const anonymous = await browser(server.base).call('GET', '/shop')
  assert.equal(anonymous.status, 401)
  const b = browser(server.base)
  const username = testName('boutique')
  assert.equal((await b.call('POST', '/auth/signup', { username, password: STRONG_PASSWORD })).status, 201)
  await prisma.player.update({ where: { usernameKey: username.toLowerCase() }, data: { sardines: 500 } })
  const shop = await b.call('GET', '/shop')
  assert.equal(shop.status, 200)
  assert.equal(shop.body.items.find((item) => item.id === 'glacon').price, 200)
  const bought = await b.call('POST', '/shop/glacon')
  assert.equal(bought.status, 200)
  assert.equal(bought.body.inventory.sardines, 300)
  assert.equal(bought.body.inventory.freezes.count, 1)
})

test('GET /api/quests fournit trois quêtes quotidiennes et le défi du mois', async () => {
  const b = browser(server.base)
  const { status, body } = await b.call('GET', '/quests')
  assert.equal(status, 200)
  assert.equal(body.daily.length, 3)
  assert.equal(body.daily[0].id, 'daily')
  assert.equal(body.monthly.goal, 120)
  assert.equal(body.monthly.done, false)
})
