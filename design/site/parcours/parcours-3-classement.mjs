// Parcours 3 : un joueur regarde son rang face aux autres et repart avec une raison précise de
// revenir demain. sacha_31 consulte le classement, joue l'épisode du jour sans faute, puis
// revoit sa place. Le Capitaine, lui, a déjà joué : il ne lui reste que demain.
//   node design/site/parcours/parcours-3-classement.mjs <url> [mobile|bureau]
import { ouvrir, attendre } from '../outils/navigateur.mjs'
import { reinitialiser, seConnecter, etape, repondreJuste, attendreCorrection, missionDuJour } from './commun.mjs'

const base = process.argv[2] || 'http://localhost:5237'
const format = process.argv[3] || 'mobile'
const p = (n) => `p3-${String(n).padStart(2, '0')}`

const { browser, page, erreurs } = await ouvrir(format)
try {
  await reinitialiser(page, base)
  const mission = await missionDuJour()
  await seConnecter(page, base, 'sacha_31')

  // Le classement de la semaine, puis depuis le début.
  await page.getByRole('link', { name: /^Classement/ }).first().click()
  await etape(page, `${p(1)}-classement-semaine`, format)
  await etape(page, `${p(2)}-classement-semaine-page`, format, { pleinePage: true, attente: 200 })
  await page.getByRole('link', { name: 'Depuis le début' }).click()
  await etape(page, `${p(3)}-classement-tout-page`, format, { pleinePage: true })

  // L'épisode du jour, sans faute.
  await page.goto(`${base}/`)
  await attendre(page)
  await page.getByRole('button', { name: /^Lire l’épisode|^Reprendre/ }).click()
  for (const question of mission.questions) {
    await attendre(page, 300)
    await repondreJuste(page, question)
    await attendreCorrection(page)
    await page.getByRole('button', { name: /^(Case suivante|Voir la fin de l’épisode)/ }).click()
  }
  await attendre(page, 3000)
  const rang = page.locator('.rank')
  await rang.scrollIntoViewIfNeeded()
  await etape(page, `${p(4)}-fin-rang`, format, { attente: 400 })
  await etape(page, `${p(5)}-fin-page`, format, { pleinePage: true, attente: 200 })

  // Sa nouvelle place.
  await page.getByRole('link', { name: 'Voir le classement' }).click()
  await etape(page, `${p(6)}-classement-apres`, format)
  await etape(page, `${p(7)}-classement-apres-page`, format, { pleinePage: true, attente: 200 })

  // Le Capitaine : premier, pseudo de trente caractères, épisode du jour déjà joué.
  await page.goto(`${base}/mon-compte`)
  await attendre(page)
  await page.getByRole('button', { name: /^Me déconnecter|^Se déconnecter/ }).click()
  await attendre(page)
  await seConnecter(page, base, 'Capitaine_des_mots_de_passe_42')
  await page.goto(`${base}/`)
  await etape(page, `${p(8)}-capitaine-accueil`, format, { attente: 1200 })
  await etape(page, `${p(9)}-capitaine-accueil-page`, format, { pleinePage: true, attente: 200 })
  await page.goto(`${base}/classement?periode=tout`)
  await etape(page, `${p(10)}-capitaine-classement-tout-page`, format, { pleinePage: true })
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
