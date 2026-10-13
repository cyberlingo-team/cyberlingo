// Parcours 2 : un habitué (sacha_31), sur son téléphone, voit où il en est, fait l'épisode du
// jour en trois minutes et repart en ayant compris quelque chose. Il se trompe une fois, exprès,
// pour voir la correction d'une erreur.
//   node design/site/parcours/parcours-2-habitue.mjs <url> [mobile|bureau]
import { ouvrir, attendre } from '../outils/navigateur.mjs'
import { reinitialiser, etape, repondreJuste, attendreCorrection, missionDuJour, MOT_DE_PASSE_DEMO } from './commun.mjs'

const base = process.argv[2] || 'http://localhost:5237'
const format = process.argv[3] || 'mobile'
const p = (n) => `p2-${String(n).padStart(2, '0')}`
const CASE_RATEE = 3

const { browser, page, erreurs } = await ouvrir(format)
try {
  await reinitialiser(page, base)
  const mission = await missionDuJour()
  console.log(`  Épisode du jour : ${mission.id} (${mission.questions.length} cases)`)

  // Il se connecte.
  await page.goto(`${base}/connexion`)
  await etape(page, `${p(1)}-connexion`, format)
  await page.getByLabel('Pseudo').fill('sacha_31')
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE_DEMO)
  await page.getByRole('button', { name: 'Me connecter' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/connexion'))

  // Où il en est : l'accueil, puis Mon Tux.
  await etape(page, `${p(2)}-accueil`, format, { attente: 1200 })
  await etape(page, `${p(3)}-accueil-page`, format, { pleinePage: true, attente: 200 })
  await page.getByRole('link', { name: /Mon Tux/ }).first().click()
  await etape(page, `${p(4)}-mon-tux-avant`, format)
  await etape(page, `${p(5)}-mon-tux-avant-page`, format, { pleinePage: true, attente: 200 })

  // L'épisode du jour.
  await page.getByRole('link', { name: /Aujourd’hui/ }).first().click()
  await attendre(page)
  const debut = Date.now()
  await page.getByRole('button', { name: /^Lire l’épisode|^Reprendre/ }).click()
  for (let i = 1; i <= mission.questions.length; i++) {
    await attendre(page, 500)
    await etape(page, `${p(4 + i * 2)}-case-${i}`, format, { pleinePage: true })
    await repondreJuste(page, mission.questions[i - 1], { faux: i === CASE_RATEE })
    await attendreCorrection(page)
    await etape(page, `${p(5 + i * 2)}-correction-${i}`, format, { pleinePage: true })
    const suivante = page.getByRole('button', { name: /^(Case suivante|Voir la fin de l’épisode)/ })
    await suivante.click()
  }
  console.log(`  Épisode joué en ${Math.round((Date.now() - debut) / 1000)} s de script.`)

  // La fin : le Tux grandit, la moralité, la raison de revenir.
  await attendre(page, 900)
  await etape(page, `${p(20)}-fin-tampon`, format, { attente: 100 })
  await etape(page, `${p(21)}-fin`, format, { attente: 2600 })
  await etape(page, `${p(22)}-fin-page`, format, { pleinePage: true, attente: 200 })
  await page.getByRole('link', { name: /Mon Tux/ }).first().click()
  await etape(page, `${p(23)}-mon-tux-apres-page`, format, { pleinePage: true })
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
