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

// Une capture pleine page ne fait pas défiler l'écran : les images en chargement différé
// (loading="lazy") resteraient vides, et celles jamais affichées ne sont pas encore décodées
// (decoding="async"). On les charge et on les décode toutes avant de capturer.
async function chargerImages(page) {
  await page.evaluate(async () => {
    const images = [...document.images]
    for (const image of images) image.loading = 'eager'
    const chargees = Promise.all(
      images.map((image) =>
        image.complete
          ? null
          : new Promise((fini) => {
              image.addEventListener('load', fini, { once: true })
              image.addEventListener('error', fini, { once: true })
            }),
      ),
    )
    // Pas plus de cinq secondes : une image qui ne répond pas ne bloque pas le parcours.
    await Promise.race([chargees, new Promise((fini) => setTimeout(fini, 5000))])
    await Promise.all(images.map((image) => image.decode().catch(() => {})))
  })
}

export async function etape(page, nom, format, options = {}) {
  await attendre(page, options.attente ?? 700)
  if (options.pleinePage) await chargerImages(page)
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

// La mission publiée à une date, lue directement dans les données de la simulation : un
// parcours peut ainsi répondre juste, comme un joueur qui a compris.
export async function missionDuJour(date = aujourdhui()) {
  const { missionForDate } = await import('../../../frontend/src/api/simulation/calendar.js')
  return missionForDate(date)
}

export function aujourdhui() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const espaces = (texte) => texte.replace(/[\s  ]+/g, ' ').trim()

// Les zones d'un artefact : { id: texte }.
function zonesDe(artefact) {
  const zones = {}
  for (const m of JSON.stringify(artefact || {}).matchAll(/\{\{([^|}]+)\|([^}]*)\}\}/g)) zones[m[1]] = espaces(m[2])
  return zones
}

// Répond à la case affichée, juste (par défaut) ou faux exprès.
export async function repondreJuste(page, question, { faux = false } = {}) {
  const { kind, answer } = question
  if (kind === 'trap') {
    const piege = (answer === 'trap') !== faux
    await page.getByRole('button', { name: piege ? /^Piège/ : /^Fiable/ }).click()
  } else if (kind === 'truefalse') {
    await page.getByRole('button', { name: (answer === true) !== faux ? /^Vrai/ : /^Faux/ }).click()
  } else if (kind === 'choice') {
    const juste = question.options.findIndex((o) => o.id === answer)
    const index = faux ? (juste + 1) % question.options.length : juste
    await page.getByRole('radio').nth(index).click()
    await page.getByRole('button', { name: 'Valider ma réponse' }).click()
  } else if (kind === 'clues') {
    const zones = zonesDe(question.artifact)
    const visees = faux
      ? [...answer.slice(0, question.pick - 1), Object.keys(zones).find((z) => !answer.includes(z))]
      : answer.slice(0, question.pick)
    const boutons = page.locator('button.zone--pick')
    const n = await boutons.count()
    for (let i = 0; i < n; i++) {
      const texte = espaces((await boutons.nth(i).textContent()) || '')
      if (visees.some((z) => zones[z] === texte)) await boutons.nth(i).click()
    }
    await page.getByRole('button', { name: /^Valider mes indices/ }).click()
  } else {
    throw new Error(`Type de case inconnu : ${kind}`)
  }
  return kind
}
