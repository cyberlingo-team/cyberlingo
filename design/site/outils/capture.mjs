// Capture d'écran d'une adresse, en bureau (1440×900) et en mobile (390×844, densité 2).
//
//   node design/site/outils/capture.mjs <url> <nom> [--bureau|--mobile] [--pleine-page] [--attente ms]
//
// Écrit design/site/rendus/<nom>-bureau.png et/ou <nom>-mobile.png, puis affiche les erreurs
// de la console de la page s'il y en a.
import { ouvrir, attendre, capturer } from './navigateur.mjs'

const args = process.argv.slice(2)
const positionnels = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--attente')
const [url, nom] = positionnels
if (!url || !nom) {
  console.error('Usage : node design/site/outils/capture.mjs <url> <nom> [--bureau|--mobile] [--pleine-page] [--attente ms]')
  process.exit(2)
}
const formats = args.includes('--bureau') ? ['bureau'] : args.includes('--mobile') ? ['mobile'] : ['bureau', 'mobile']
const pleinePage = args.includes('--pleine-page')
const i = args.indexOf('--attente')
const attente = i >= 0 ? Number(args[i + 1]) : 800

let echec = false
for (const format of formats) {
  const { browser, page, erreurs } = await ouvrir(format)
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 })
    await attendre(page, attente)
    console.log(await capturer(page, nom, format, { pleinePage }))
    for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  } catch (e) {
    echec = true
    console.error(`Échec en ${format} : ${e.message}`)
  } finally {
    await browser.close()
  }
}
process.exit(echec ? 1 : 0)
