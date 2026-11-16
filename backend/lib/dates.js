// Les jours du jeu. La mission du jour change à minuit, heure de Paris, quel que soit le fuseau
// de la machine qui fait tourner le serveur. Le serveur échange les jours en chaînes
// « AAAA-MM-JJ » ; la base les range dans des colonnes `@db.Date`.

export { addDays, dayNumber, daysBetween } from '../../frontend/src/api/simulation/dates.js'

const PARIS = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })

// Le jour qu'il est à Paris, en « AAAA-MM-JJ » (le format canadien français s'écrit ainsi).
export function today(now = new Date()) {
  return PARIS.format(now)
}

// « 2026-10-13 » → la valeur à donner à Prisma pour une colonne @db.Date.
export function toDbDate(isoDate) {
  return new Date(`${isoDate}T00:00:00.000Z`)
}

// Une colonne @db.Date lue par Prisma → « 2026-10-13 ».
export function fromDbDate(date) {
  return date ? date.toISOString().slice(0, 10) : null
}

// Une date « AAAA-MM-JJ » bien écrite et qui existe au calendrier ?
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return fromDbDate(toDbDate(value)) === value
}
