// Parcours 1 : un nouveau venu arrive, comprend en moins d'une minute et répond à la première
// question. Il finit l'épisode sans compte, puis crée son compte pour garder ses points.
//   node design/site/parcours/parcours-1-nouveau-venu.mjs <url> [bureau|mobile]
import { ouvrir, attendre } from '../outils/navigateur.mjs'
import { reinitialiser, etape, repondre, attendreCorrection } from './commun.mjs'

const base = process.argv[2] || 'http://localhost:5237'
const format = process.argv[3] || 'mobile'
const p = (n) => `p1-${String(n).padStart(2, '0')}`

const { browser, page, erreurs } = await ouvrir(format)
try {
  await reinitialiser(page, base)
  const debut = Date.now()
  await page.goto(base)
  await etape(page, `${p(1)}-arrivee`, format)
  await etape(page, `${p(2)}-arrivee-page`, format, { pleinePage: true, attente: 200 })

  await page.getByRole('button', { name: /^Lire l’épisode|^Reprendre/ }).click()
  await etape(page, `${p(3)}-case-1`, format)
  await etape(page, `${p(4)}-case-1-page`, format, { pleinePage: true, attente: 200 })

  const sorte = await repondre(page, { choix: 0 })
  await attendreCorrection(page)
  console.log(`  Première réponse donnée (${sorte}) au bout de ${Math.round((Date.now() - debut) / 1000)} s de script.`)
  await etape(page, `${p(5)}-correction-1`, format)
  await etape(page, `${p(6)}-correction-1-page`, format, { pleinePage: true, attente: 200 })

  // Les cases suivantes : on varie les réponses pour voir juste et faux.
  for (let i = 2; i <= 6; i++) {
    const suivante = page.getByRole('button', { name: 'Case suivante' })
    if (!(await suivante.count())) break
    await suivante.click()
    await attendre(page, 600)
    await etape(page, `${p(5 + i * 2 - 2)}-case-${i}`, format, { pleinePage: true })
    const type = await repondre(page, { choix: i })
    await attendreCorrection(page)
    console.log(`  Case ${i} : ${type}`)
    await etape(page, `${p(5 + i * 2 - 1)}-correction-${i}`, format, { pleinePage: true })
  }

  await page.getByRole('button', { name: 'Voir la fin de l’épisode' }).click()
  await attendre(page, 2500)
  await etape(page, `${p(20)}-fin`, format)
  await etape(page, `${p(21)}-fin-page`, format, { pleinePage: true, attente: 200 })

  // Il crée son compte depuis la fin de l'épisode.
  await page.getByRole('link', { name: 'Créer mon compte' }).last().click()
  await attendre(page)
  await etape(page, `${p(22)}-inscription`, format)

  // Erreurs de formulaire : pseudo pris, mot de passe trop faible.
  await page.getByLabel('Pseudo').fill('sacha_31')
  await page.getByLabel('Mot de passe', { exact: true }).fill('soleil2024')
  await etape(page, `${p(23)}-inscription-jauge-faible`, format, { pleinePage: true })
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await attendre(page, 1200)
  await etape(page, `${p(24)}-inscription-erreurs`, format, { pleinePage: true })

  await page.getByLabel('Pseudo').fill('Banquise_Curieuse')
  await page.getByLabel('Mot de passe', { exact: true }).fill('mon chat dort sur la pile de pulls')
  await etape(page, `${p(25)}-inscription-jauge-ok`, format)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/inscription'))
  await attendre(page, 1500)
  await etape(page, `${p(26)}-apres-inscription`, format)
  await etape(page, `${p(27)}-apres-inscription-page`, format, { pleinePage: true, attente: 200 })

  await page.goto(`${base}/mon-tux`)
  await etape(page, `${p(28)}-mon-tux-premier-jour`, format, { pleinePage: true })
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
