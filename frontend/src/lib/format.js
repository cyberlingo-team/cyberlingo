// Mise en forme des textes, des nombres et des dates, à la française.

const NNBSP = ' ' // espace fine insécable
const NBSP = ' ' // espace insécable

// Les textes sont écrits avec des espaces ordinaires ; à l'affichage, on pose les espaces
// insécables de la typographie française pour que « ? » ou « » » ne partent jamais seuls à la
// ligne.
export function typo(text) {
  if (text === null || text === undefined) return ''
  return String(text)
    .replace(/ ([?!;»])/g, `${NNBSP}$1`)
    .replace(/« /g, `«${NNBSP}`)
    .replace(/ :/g, `${NBSP}:`)
    .replace(/(\d) ([€%])/g, `$1${NNBSP}$2`)
    .replace(/(\d) h (\d)/g, `$1${NBSP}h${NBSP}$2`)
    .replace(/(\d) (h|min|jours?|ans?|points?|caractères|bits)(?![\p{L}])/gu, `$1${NBSP}$2`)
}

// « l’Inspecteur » en début de phrase devient « L’Inspecteur ».
export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// « Dégaine son téléphone… » après deux-points devient « dégaine son téléphone… ».
export function lowerFirst(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : ''
}

const numberFormat = new Intl.NumberFormat('fr-FR')

export function formatNumber(value) {
  return numberFormat.format(value)
}

// « 1 point », « 0 point », « 12 points » : en français, 0 et 1 restent au singulier.
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${formatNumber(count)}${NBSP}${Math.abs(count) >= 2 ? pluralForm : singular}`
}

// « 1er », « 2e », « 14e ».
export function ordinal(rank) {
  return rank === 1 ? '1er' : `${rank}e`
}

// Les dates échangées avec le serveur sont au format « AAAA-MM-JJ ».
export function parseDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function addDaysIso(isoDate, days) {
  const date = parseDate(isoDate)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

const longDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const weekdayOnly = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
const fullDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// « mardi 13 octobre »
export function formatDay(isoDate) {
  return longDay.format(parseDate(isoDate))
}

// « 13 oct. »
export function formatShortDay(isoDate) {
  return shortDay.format(parseDate(isoDate))
}

// « mardi »
export function formatWeekday(isoDate) {
  return weekdayOnly.format(parseDate(isoDate))
}

// « 13 octobre 2026 »
export function formatFullDate(isoDate) {
  return fullDate.format(parseDate(isoDate))
}

// « aujourd'hui », « hier », « avant-hier », sinon « mardi 6 octobre ».
export function relativeDay(isoDate, today = todayIso()) {
  if (isoDate === today) return 'aujourd’hui'
  if (isoDate === addDaysIso(today, -1)) return 'hier'
  if (isoDate === addDaysIso(today, -2)) return 'avant-hier'
  return formatDay(isoDate)
}

// Temps restant avant minuit, heure du joueur : « 9 h 41 » ou « 12 min ».
export function untilMidnight(now = new Date()) {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const minutes = Math.max(1, Math.ceil((midnight - now) / 60000))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}${NBSP}min`
  return `${hours}${NBSP}h${NBSP}${String(rest).padStart(2, '0')}`
}
