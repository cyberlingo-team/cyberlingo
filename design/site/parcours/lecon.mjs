// Parcours scripté : une leçon du chemin (ou la mission du jour) jouée jusqu'au bilan, avec une
// capture de la première question, de chaque correction et du bilan.
//
//   node design/site/parcours/lecon.mjs <url de la leçon> <préfixe> [bureau|mobile]
import { ouvrir, attendre, capturer } from '../outils/navigateur.mjs'

const [url, prefixe = 'lecon', format = 'bureau'] = process.argv.slice(2)
const { browser, page, erreurs } = await ouvrir(format)
try {
  await page.goto(url)
  await attendre(page)
  for (let i = 1; i <= 8; i++) {
    const valider = page.getByRole('button', { name: 'Valider', exact: true })
    if (!(await valider.count())) break
    if (i === 1) console.log(await capturer(page, `${prefixe}-q1`, format))
    const tuiles = page.locator('.tile')
    if (await tuiles.count()) {
      await tuiles.nth(i % (await tuiles.count())).click()
    } else {
      const zones = page.locator('button.zone--pick')
      const n = Number((await page.locator('.stage-count').innerText()).match(/sur (\d+)/)?.[1] || 1)
      for (let z = 0; z < n; z++) await zones.nth(z).click()
    }
    await valider.click()
    await attendre(page, 500)
    console.log(await capturer(page, `${prefixe}-c${i}`, format))
    await page.getByRole('button', { name: /Continuer|Voir le bilan/ }).click()
    await attendre(page, 600)
  }
  console.log(await capturer(page, `${prefixe}-bilan`, format))
  console.log(await capturer(page, `${prefixe}-bilan-plein`, format, { pleinePage: true }))
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
