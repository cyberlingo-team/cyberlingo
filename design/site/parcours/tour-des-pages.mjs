// Fait le tour de toutes les adresses du site et relève les erreurs de la console.
//   node design/site/parcours/tour-des-pages.mjs <url> [bureau|mobile] [pseudo]
import { ouvrir, attendre } from '../outils/navigateur.mjs'
import { reinitialiser, seConnecter, etape } from './commun.mjs'

const base = process.argv[2] || 'http://localhost:5237'
const format = process.argv[3] || 'mobile'
const pseudo = process.argv[4] || ''

const PAGES = ['/', '/episodes', '/classement', '/classement?periode=tout', '/mon-tux', '/la-bande', '/credits', '/connexion', '/inscription', '/mon-compte', '/nulle-part', '/episode/2020-01-01']

const { browser, page, erreurs } = await ouvrir(format)
try {
  await reinitialiser(page, base)
  if (pseudo) await seConnecter(page, base, pseudo)
  for (const chemin of PAGES) {
    await page.goto(`${base}${chemin}`)
    await attendre(page, 900)
    const titre = await page.title()
    const h1 = await page.locator('h1').first().textContent().catch(() => '(pas de h1)')
    console.log(`${chemin} -> ${page.url().replace(base, '')} | ${titre} | ${h1?.trim().slice(0, 60)}`)
    const nom = `tour-${pseudo ? 'connecte' : 'visiteur'}-${chemin.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'accueil'}`
    await etape(page, nom, format, { pleinePage: true, attente: 300 })
  }
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
