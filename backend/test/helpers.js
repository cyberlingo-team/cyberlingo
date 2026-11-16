// Outils communs aux tests : lancer l'application sur un port libre, et un petit client qui
// garde ses cookies comme un navigateur. Les tests tournent contre la base de .env ; ils ne
// créent que des comptes dont le pseudo commence par « test_ », et les effacent à la fin.

import app from '../app.js'
import prisma from '../prisma.js'

export async function startServer() {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const base = `http://127.0.0.1:${server.address().port}/api`
  return {
    base,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

// Un « navigateur » : il renvoie les cookies reçus, sans pouvoir les lire depuis la page.
export function browser(base) {
  const jar = new Map()
  return {
    jar,
    async call(method, path, body) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(jar.size ? { Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      for (const line of response.headers.getSetCookie()) {
        const [pair] = line.split(';')
        const [name, value] = pair.split('=')
        if (!value || /Expires=Thu, 01 Jan 1970/i.test(line)) jar.delete(name)
        else jar.set(name, value)
      }
      const text = await response.text()
      return { status: response.status, body: text ? JSON.parse(text) : null, cookies: response.headers.getSetCookie() }
    },
  }
}

// Un pseudo de test unique.
export function testName(label) {
  return `test_${label}_${Math.random().toString(36).slice(2, 8)}`
}

export async function cleanUp() {
  await prisma.player.deleteMany({ where: { usernameKey: { startsWith: 'test_' } } })
  await prisma.loginFailure.deleteMany({ where: { usernameKey: { startsWith: 'test_' } } })
  await prisma.$disconnect()
}

export const STRONG_PASSWORD = 'Une-phrase-de-passe-solide-2026'
