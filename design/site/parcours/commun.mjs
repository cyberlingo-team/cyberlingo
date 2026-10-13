// Outils partagés par les parcours : se connecter, répondre à une case, capturer une étape.
// Les actions passent par le texte visible, comme le ferait un joueur.
import { attendre, capturer } from '../outils/navigateur.mjs'

export const MOT_DE_PASSE_DEMO = 'banquise-sardine-parapluie'

// Repart d'un navigateur vierge : comptes créés et parties jouées effacés, mode normal.
export async function reinitialiser(page, base) {
  await page.goto(`${base}/?simulation=reinitialiser`)
  await attendre(page)
  await page.goto(`${base}/?simulation=normal`)
  await attendre(page)
}

export async function etape(page, nom, format, options = {}) {
  await attendre(page, options.attente ?? 700)
  const chemin = await capturer(page, nom, format, { pleinePage: options.pleinePage ?? false })
  console.log(`  ${chemin}`)
  return chemin
}

export async function seConnecter(page, base, pseudo, motDePasse = MOT_DE_PASSE_DEMO) {
  await page.goto(`${base}/connexion`)
  await attendre(page)
  await page.getByLabel('Pseudo').fill(pseudo)
  await page.getByLabel('Mot de passe', { exact: true }).fill(motDePasse)
  await page.getByRole('button', { name: 'Me connecter' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/connexion'))
  await attendre(page)
}

// Répond à la case affichée. `juste` : true pour viser la bonne réponse quand on la connaît
// (on ne la connaît pas : on choisit au hasard déterministe), sinon la première venue.
export async function repondre(page, { choix = 0 } = {}) {
  const piege = page.getByRole('button', { name: /^Piège/ })
  const vrai = page.getByRole('button', { name: /^Vrai/ })
  const options = page.getByRole('radio')
  const zones = page.locator('button.zone--pick')
  if (await piege.count()) {
    const bouton = choix % 2 === 0 ? piege : page.getByRole('button', { name: /^Fiable/ })
    await bouton.click()
    return 'piège ou fiable'
  }
  if (await vrai.count()) {
    const bouton = choix % 2 === 0 ? vrai : page.getByRole('button', { name: /^Faux/ })
    await bouton.click()
    return 'vrai ou faux'
  }
  if (await options.count()) {
    const n = await options.count()
    await options.nth(choix % n).click()
    await page.getByRole('button', { name: 'Valider ma réponse' }).click()
    return 'choix'
  }
  if (await zones.count()) {
    const valider = page.getByRole('button', { name: /^Valider mes indices/ })
    const n = await zones.count()
    for (let i = 0; i < n && !(await valider.isEnabled()); i++) {
      await zones.nth((i + choix) % n).click()
    }
    await valider.click()
    return 'indices'
  }
  throw new Error('Aucune façon de répondre à cette case.')
}

export async function attendreCorrection(page) {
  await page.getByRole('button', { name: /^(Case suivante|Voir la fin de l’épisode|Reprendre|Revenir)/ }).waitFor()
  await attendre(page, 900)
}
