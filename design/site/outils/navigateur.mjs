// Fonctions partagées par capture.mjs et par les scripts de parcours.
// Playwright pilote le Chrome déjà installé sur la machine : aucun navigateur n'est téléchargé.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RENDUS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'rendus')

export const FORMATS = {
  bureau: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}

// Ouvre un onglet au format demandé. `erreurs` se remplit des erreurs de la console de la page.
export async function ouvrir(format = 'bureau') {
  if (!FORMATS[format]) throw new Error(`Format inconnu : ${format} (bureau ou mobile)`)
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || '/usr/bin/google-chrome',
    headless: true,
  })
  const context = await browser.newContext({ ...FORMATS[format], locale: 'fr-FR' })
  const page = await context.newPage()
  const erreurs = []
  page.on('console', (m) => {
    // Les ressources introuvables sont signalées avec leur adresse par l'écouteur 'response'.
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) erreurs.push(m.text())
  })
  page.on('pageerror', (e) => erreurs.push(e.message))
  page.on('response', (r) => { if (r.status() >= 400) erreurs.push(`HTTP ${r.status()} sur ${r.url()}`) })
  return { browser, page, erreurs }
}

// Attend que la page soit posée (réseau calme, polices chargées, animations d'entrée jouées).
export async function attendre(page, ms = 800) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(ms)
}

// Enregistre rendus/<nom>-<format>.png et renvoie son chemin.
export async function capturer(page, nom, format, { pleinePage = false } = {}) {
  mkdirSync(RENDUS, { recursive: true })
  const chemin = join(RENDUS, `${nom}-${format}.png`)
  await page.screenshot({ path: chemin, fullPage: pleinePage })
  return chemin
}
