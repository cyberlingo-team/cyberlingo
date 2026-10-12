// Exemple de parcours scripté : ouvrir, agir, capturer chaque étape.
// Le recopier dans design/site/parcours/ et l'adapter ; ne pas modifier ce fichier.
//
//   node design/site/outils/exemple-parcours.mjs <url> [bureau|mobile]
import { ouvrir, attendre, capturer } from './navigateur.mjs'

const url = process.argv[2]
const format = process.argv[3] || 'mobile'
if (!url) {
  console.error('Usage : node design/site/outils/exemple-parcours.mjs <url> [bureau|mobile]')
  process.exit(2)
}

const { browser, page, erreurs } = await ouvrir(format)
try {
  await page.goto(url)
  await attendre(page)
  console.log(await capturer(page, 'exemple-01-arrivee', format))

  // Agir comme un utilisateur, par le texte visible plutôt que par les classes CSS :
  //   await page.getByRole('button', { name: 'Commencer' }).click()
  //   await page.getByLabel('Pseudo').fill('manchot_curieux')
  //   await page.getByText('Mot de passe trop court').waitFor()
  await page.mouse.wheel(0, 600)
  await attendre(page, 400)
  console.log(await capturer(page, 'exemple-02-apres-defilement', format))
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
