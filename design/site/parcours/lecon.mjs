// Parcours scripté : une leçon du chemin (ou la mission du jour) jouée jusqu'au bilan, avec une
// capture de la première question, de chaque correction, des questions rejouées et de chaque
// écran du bilan.
//
//   node design/site/parcours/lecon.mjs <url de la leçon> <préfixe> [bureau|mobile]
import { ouvrir, attendre, capturer } from '../outils/navigateur.mjs'

const [url, prefixe = 'lecon', format = 'bureau'] = process.argv.slice(2)
const { browser, page, erreurs } = await ouvrir(format)
try {
  await page.goto(url)
  await attendre(page)
  for (let i = 1; i <= 14; i++) {
    const valider = page.getByRole('button', { name: 'Valider', exact: true })
    if (!(await valider.count())) break
    if (i === 1) console.log(await capturer(page, `${prefixe}-q1`, format))
    // La troisième question est passée, pour voir « Passer » à l'œuvre.
    const passer = page.getByRole('button', { name: 'Passer', exact: true })
    if (i === 3 && (await passer.count())) {
      await passer.click()
    } else {
      const options = page.locator('.cl-option')
      if (await options.count()) {
        await options.nth(i % (await options.count())).click()
      } else {
        const zones = page.locator('button.zone--pick')
        const n = Number((await page.locator('.cl-count').innerText()).match(/sur (\d+)/)?.[1] || 1)
        for (let z = 0; z < n; z++) await zones.nth(z).click()
      }
      await valider.click()
    }
    await attendre(page, 500)
    console.log(await capturer(page, `${prefixe}-c${i}`, format))
    await page.getByRole('button', { name: /Continuer|Voir le bilan/ }).click()
    await attendre(page, 600)
  }
  for (let e = 1; e <= 6; e++) {
    console.log(await capturer(page, `${prefixe}-bilan${e}`, format))
    const demasquer = page.getByRole('button', { name: 'Le démasquer' })
    if (await demasquer.count()) {
      await demasquer.click()
      await attendre(page, 300)
      console.log(await capturer(page, `${prefixe}-bilan${e}-demasque`, format))
    }
    const suite = page.getByRole('button', { name: /^(Continuer|Plus tard)$/ })
    if (!(await suite.count())) break
    await suite.first().click()
    await attendre(page, 500)
    if (!page.url().match(/lecon|mission-du-jour/)) break
  }
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
