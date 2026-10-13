// La « base de données » du serveur simulé, rangée dans le localStorage du navigateur.
// Seul server.js y touche : l'interface n'en lit jamais rien, exactement comme elle ne lira
// jamais PostgreSQL. Le vrai back-end la remplacera par les tables Prisma.
//
//   accounts   comptes créés, par pseudo en minuscules :
//              { username, salt, hash, createdAt, seed, results, practice }
//              seed      pseudo d'origine d'un compte de démonstration (son passé en dépend)
//              results   épisodes joués le jour même, qui comptent : { [date]: Attempt }
//              practice  épisodes rattrapés après coup, pour s'entraîner : { [date]: Attempt }
//   session    ce que porterait le cookie httpOnly : { username, guest }
//              guest     réponses d'un visiteur sans compte : { [date]: Attempt }
//   failures   échecs de connexion récents, par pseudo en minuscules : [horodatages]
//   seeded     jour où les comptes de démonstration ont été remis dans leur état de départ
//
// Attempt = { answers: { [questionId]: { answer, correct } }, points?, completedAt? }

const KEY = 'cyberlingo.simulation.v1'

// Si le navigateur refuse le localStorage (navigation privée stricte, quota plein), la base
// vit en mémoire le temps de la page.
let memory = null

function empty() {
  return { accounts: {}, session: { username: null, guest: {} }, failures: {}, seeded: null }
}

export function load() {
  if (memory) return structuredClone(memory)
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const db = { ...empty(), ...JSON.parse(raw) }
    db.session = { username: null, guest: {}, ...db.session }
    return db
  } catch {
    return empty()
  }
}

export function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
    memory = null
  } catch {
    memory = structuredClone(db)
  }
}

export function reset() {
  memory = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Rien à effacer.
  }
}
