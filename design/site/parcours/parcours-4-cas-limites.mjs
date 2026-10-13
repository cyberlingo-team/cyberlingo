// Parcours 4 : les cas limites. Chargement lent, serveur en panne, adresses inexistantes,
// erreurs de formulaire, série perdue, tout premier jour, pseudo de trente caractères,
// animations désactivées.
//   node design/site/parcours/parcours-4-cas-limites.mjs <url> [mobile|bureau]
import { ouvrir, attendre } from '../outils/navigateur.mjs'
import { reinitialiser, seConnecter, etape, repondreJuste, attendreCorrection, missionDuJour, MOT_DE_PASSE_DEMO } from './commun.mjs'

const base = process.argv[2] || 'http://localhost:5237'
const format = process.argv[3] || 'mobile'
const c = (n) => `c-${String(n).padStart(2, '0')}`

async function seDeconnecter(page) {
  await page.goto(`${base}/mon-compte`)
  await attendre(page)
  await page.getByRole('button', { name: 'Me déconnecter' }).click()
  await attendre(page)
}

const { browser, page, erreurs } = await ouvrir(format)
try {
  await reinitialiser(page, base)

  // Le serveur est lent : les écrans de chargement.
  await page.goto(`${base}/?simulation=lent`)
  await page.waitForTimeout(500)
  await etape(page, `${c(1)}-chargement-accueil`, format, { attente: 0 })
  await page.goto(`${base}/classement`)
  await page.waitForTimeout(500)
  await etape(page, `${c(2)}-chargement-classement`, format, { attente: 0 })

  // Le serveur ne répond plus.
  await page.goto(`${base}/?simulation=panne`)
  await etape(page, `${c(3)}-panne-accueil`, format, { attente: 2500 })
  await page.goto(`${base}/classement`)
  await etape(page, `${c(4)}-panne-classement`, format, { attente: 2500 })
  await page.goto(`${base}/connexion`)
  await attendre(page, 2500)
  await page.getByLabel('Pseudo').fill('sacha_31')
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE_DEMO)
  await page.getByRole('button', { name: 'Me connecter' }).click()
  await etape(page, `${c(5)}-panne-connexion`, format, { attente: 2500 })
  await page.goto(`${base}/?simulation=normal`)
  await attendre(page)

  // Des adresses qui n'existent pas.
  await page.goto(`${base}/nulle-part`)
  await etape(page, `${c(6)}-adresse-inexistante`, format, { pleinePage: true })
  await page.goto(`${base}/episode/2020-01-01`)
  await etape(page, `${c(7)}-episode-inexistant`, format, { pleinePage: true })
  await page.goto(`${base}/episode/2099-01-01`)
  await etape(page, `${c(8)}-episode-futur`, format, { pleinePage: true })

  // Erreurs de connexion : champs vides, mauvais mot de passe, trop d'essais.
  await page.goto(`${base}/connexion`)
  await attendre(page)
  await page.getByRole('button', { name: 'Me connecter' }).click()
  await etape(page, `${c(9)}-connexion-vide`, format, { pleinePage: true })
  await page.getByLabel('Pseudo').fill('sacha_31')
  for (let i = 1; i <= 6; i++) {
    await page.getByLabel('Mot de passe', { exact: true }).fill(`banquise-${i}`)
    await page.getByRole('button', { name: 'Me connecter' }).click()
    // On attend la réponse du serveur avant l'essai suivant, comme un joueur qui lit le message.
    await page.getByRole('button', { name: 'Me connecter' }).and(page.locator(':enabled')).waitFor()
    await attendre(page, 300)
    if (i === 1) await etape(page, `${c(10)}-connexion-erreur`, format, { pleinePage: true })
  }
  await etape(page, `${c(11)}-connexion-bloquee`, format, { pleinePage: true })

  // La série perdue : malo.dlt n'a pas joué hier.
  await reinitialiser(page, base)
  await seConnecter(page, base, 'malo.dlt')
  await page.goto(`${base}/`)
  await etape(page, `${c(12)}-serie-perdue-accueil`, format, { attente: 1200 })
  await page.goto(`${base}/mon-tux`)
  await etape(page, `${c(13)}-serie-perdue-mon-tux-page`, format, { pleinePage: true })
  await page.goto(`${base}/episodes`)
  await etape(page, `${c(14)}-episodes-page`, format, { pleinePage: true })
  await page.locator('a[href^="/episode/"]').filter({ hasText: /Manqué/ }).first().click()
  await etape(page, `${c(15)}-rattrapage-couverture`, format)
  await page.goto(`${base}/la-bande`)
  await etape(page, `${c(16)}-la-bande-page`, format, { pleinePage: true })
  await seDeconnecter(page)

  // Le tout premier jour : un compte créé à l'instant, qui n'a encore rien joué.
  await page.goto(`${base}/inscription`)
  await attendre(page)
  await page.getByLabel('Pseudo').fill('Pingouin_Neuf')
  await page.getByLabel('Mot de passe', { exact: true }).fill('trois pingouins sur la banquise')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/inscription'))
  await etape(page, `${c(17)}-premier-jour-accueil`, format, { attente: 1200 })
  await page.goto(`${base}/mon-tux`)
  await etape(page, `${c(18)}-premier-jour-mon-tux-page`, format, { pleinePage: true })
  await page.goto(`${base}/classement`)
  await etape(page, `${c(19)}-premier-jour-classement-page`, format, { pleinePage: true })
  await page.goto(`${base}/episodes`)
  await etape(page, `${c(20)}-premier-jour-episodes-page`, format, { pleinePage: true })

  // Mon compte : pseudo déjà pris, mauvais mot de passe actuel.
  await page.goto(`${base}/mon-compte`)
  await attendre(page)
  await page.getByLabel('Nouveau pseudo').fill('sacha_31')
  await page.getByRole('button', { name: 'Changer de pseudo' }).click()
  await attendre(page, 900)
  await page.getByLabel('Mot de passe actuel').fill('pas le bon')
  await page.getByLabel('Nouveau mot de passe').fill('quatre pingouins sous la banquise')
  await page.getByRole('button', { name: 'Changer de mot de passe' }).click()
  await etape(page, `${c(21)}-compte-erreurs-page`, format, { pleinePage: true, attente: 1200 })

  // Animations désactivées : le croquis de chargement s'affiche entier, l'épisode du jour se
  // joue d'une traite et la fin s'affiche d'un coup.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${base}/classement?simulation=lent`)
  await page.waitForTimeout(700)
  await etape(page, `${c(22)}-sans-animation-chargement`, format, { attente: 0 })
  const mission = await missionDuJour()
  await page.goto(`${base}/?simulation=normal`)
  await attendre(page)
  await page.getByRole('button', { name: /^Lire l’épisode|^Reprendre/ }).click()
  for (const [i, question] of mission.questions.entries()) {
    await attendre(page, 200)
    await repondreJuste(page, question, { faux: i === 1 })
    await attendreCorrection(page)
    if (i === 1) await etape(page, `${c(23)}-sans-animation-correction`, format, { attente: 0 })
    await page.getByRole('button', { name: /^(Case suivante|Voir la fin de l’épisode)/ }).click()
  }
  await page.getByRole('heading', { name: 'Moralité' }).waitFor()
  await etape(page, `${c(24)}-sans-animation-fin`, format, { attente: 300 })
  await etape(page, `${c(25)}-sans-animation-fin-page`, format, { pleinePage: true, attente: 0 })

  await page.goto(`${base}/credits`)
  await etape(page, `${c(26)}-credits-page`, format, { pleinePage: true })
} finally {
  for (const e of erreurs) console.log(`  ERREUR CONSOLE (${format}) : ${e}`)
  await browser.close()
}
