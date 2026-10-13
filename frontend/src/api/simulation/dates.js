// Les dates de la simulation se calent sur le jour où l'on ouvre le site : la vidéo sera
// tournée un autre jour que celui où les données ont été écrites.
// Format partagé avec le futur serveur : « AAAA-MM-JJ », dans le fuseau du navigateur.

const DAY_MS = 24 * 60 * 60 * 1000

export function today() {
  return toIsoDate(new Date())
}

export function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d + days, 12)
  return toIsoDate(date)
}

// Nombre de jours écoulés depuis le 1er janvier 2000 (sert d'index stable pour un jour donné).
export function dayNumber(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / DAY_MS)
}

export function daysBetween(fromIso, toIso) {
  return dayNumber(toIso) - dayNumber(fromIso)
}
