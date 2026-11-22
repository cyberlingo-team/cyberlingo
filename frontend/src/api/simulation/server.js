// Le serveur simulé. Il répond aux routes décrites dans ../CONTRAT.md exactement comme le fera
// le back-end Express : mêmes chemins, mêmes réponses, mêmes erreurs. Il vérifie les réponses
// lui-même : l'interface ne reçoit jamais la solution d'une question avant d'y avoir répondu.

import { load, save } from './store.js'
import { demoWorld, demoPath, DEMO_ACCOUNTS, DEMO_PASSWORD } from './players.js'
import { missionForDate, isPublished, publishedDates, launchDate } from './calendar.js'
import { today as currentDate, addDays, daysBetween, dayNumber } from './dates.js'
import {
  STAGES,
  stageFor,
  missionPoints,
  POINTS_PER_CORRECT_ANSWER,
  PERFECT_BONUS,
  STREAK_BONUS_PER_DAY,
  STREAK_BONUS_MAX_DAYS,
  lessonPoints,
  STARTING_SARDINES,
  MAX_BUOYS,
  MAX_FREEZES,
  SARDINES,
  SHOP,
} from './rules.js'
import { NODES, nodeById, unitById, lessonContent } from './path.js'
import { UNITS } from './units.js'
import { GANG, VILLAIN, DISGUISES } from './cast.js'
import { sha256 } from './sha256.js'

// Règles des comptes, que le vrai serveur reprendra telles quelles. Elles suivent la
// recommandation de la CNIL sur les mots de passe (délibération n° 2022-100) :
//   - robustesse d'au moins 80 bits, calculée comme la CNIL : longueur × log2(taille de
//     l'alphabet utilisé), avec 26 minuscules, 26 majuscules, 10 chiffres et 40 autres signes ;
//     12 caractères des quatre sortes y suffisent, une phrase de passe aussi ;
//   - 64 caractères au plus, et 72 octets : bcrypt ne lit pas au-delà ;
//   - espaces et collage acceptés, mots de passe trop courants refusés, refus expliqué ;
//   - après 5 échecs, temporisation qui double à chaque nouvel échec (2 min, 4 min, 8 min…),
//     et 25 essais au plus par 24 heures.
export const ACCOUNT_RULES = {
  username: { minLength: 3, maxLength: 30 },
  password: {
    minBits: 80,
    maxLength: 64,
    maxBytes: 72,
    alphabets: { lowercase: 26, uppercase: 26, digits: 10, others: 40 },
  },
  login: { freeFailures: 5, firstDelaySeconds: 120, maxFailuresPerDay: 25 },
}

// Robustesse d'un mot de passe en bits, selon la méthode de la CNIL.
export function passwordBits(password) {
  const { alphabets } = ACCOUNT_RULES.password
  let size = 0
  if (/[a-z]/.test(password)) size += alphabets.lowercase
  if (/[A-Z]/.test(password)) size += alphabets.uppercase
  if (/[0-9]/.test(password)) size += alphabets.digits
  if (/[^a-zA-Z0-9]/.test(password)) size += alphabets.others
  return size ? Math.floor([...password].length * Math.log2(size)) : 0
}

// Les plus devinables : ceux que les pirates essaient en premier.
const GUESSABLE_PASSWORDS = [
  'motdepasse', 'password', 'azerty', 'qwerty', 'azertyuiop', 'qwertyuiop', '123456', '1234567890',
  'soleil', 'bonjour', 'doudou', 'loulou', 'chouchou', 'iloveyou', 'jetaime', 'cyberlingo', 'admin',
]

class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const reply = (status, body) => ({ reply: true, status, body })

// ---------------------------------------------------------------------------------------
// Routage

const routes = []

function route(method, pattern, handler) {
  const keys = []
  const source = pattern.replace(/:(\w+)/g, (_, key) => {
    keys.push(key)
    return '([^/]+)'
  })
  routes.push({ method, regex: new RegExp(`^${source}$`), keys, handler })
}

export async function handle(method, url, body) {
  const { pathname, searchParams } = new URL(url, 'http://simulation.local')
  const path = pathname.replace(/^\/api(?=\/)/, '')
  const candidates = routes.filter((r) => r.regex.test(path))
  if (!candidates.length) return error(404, 'route_not_found', 'Cette route n’existe pas.')
  const found = candidates.find((r) => r.method === method)
  if (!found) return error(405, 'method_not_allowed', 'Méthode non prise en charge sur cette route.')

  const match = found.regex.exec(path)
  const params = Object.fromEntries(found.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]))
  const db = load()
  const context = { db, today: currentDate(), params, query: searchParams, body: body ?? {} }
  seedDemoAccounts(db, context.today)
  applyFreezes(context)
  try {
    const result = found.handler(context)
    save(db)
    if (result === undefined) return { status: 204, body: null }
    if (result.reply) return { status: result.status, body: result.body }
    return { status: 200, body: result }
  } catch (e) {
    if (!(e instanceof HttpError)) throw e
    // Les échecs de connexion comptent même quand la requête échoue.
    save(db)
    return error(e.status, e.code, e.message, e.fields)
  }
}

function error(status, code, message, fields) {
  return { status, body: { error: { code, message, ...(fields ? { fields } : {}) } } }
}

// ---------------------------------------------------------------------------------------
// Comptes

// Les comptes de démonstration repartent chaque jour de leur état de départ. Leur passé est
// recalculé à partir de la date du jour (players.js) : ce qu'on y a joué les jours précédents ne
// s'accorderait plus avec lui (la série perdue d'hier redeviendrait une série de dix jours).
function seedDemoAccounts(db, today) {
  if (db.seeded === today) return
  for (const [key, account] of Object.entries(db.accounts)) if (account.seed) delete db.accounts[key]
  for (const demo of DEMO_ACCOUNTS) {
    // Un joueur a pu prendre ce pseudo après avoir supprimé le compte de démonstration : il le garde.
    if (db.accounts[demo.username.toLowerCase()]) continue
    const salt = `demo-${demo.username}`
    db.accounts[demo.username.toLowerCase()] = {
      username: demo.username,
      salt,
      hash: sha256(`${salt}:${DEMO_PASSWORD}`),
      createdAt: null,
      seed: demo.username,
      results: {},
      practice: {},
      progress: demoProgress(demo, today),
    }
  }
  // Un compte de démonstration renommé hier n'existe plus : sa session non plus.
  if (db.session.username && !db.accounts[db.session.username.toLowerCase()]) db.session.username = null
  db.seeded = today
}

// Le parcours et la réserve d'un compte de démonstration, recalés sur la date du jour.
function demoProgress(demo, today) {
  const { history, chests } = demoPath(demo, today)
  return { ...newProgress(), history, chests, sardines: demo.sardines, freezes: demo.freezes, buoys: { count: MAX_BUOYS, day: today } }
}

function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function passwordMatches(account, password) {
  return typeof password === 'string' && sha256(`${account.salt}:${password}`) === account.hash
}

function currentAccount(ctx) {
  const name = ctx.db.session.username
  return name ? ctx.db.accounts[name.toLowerCase()] || null : null
}

function requireAccount(ctx) {
  const account = currentAccount(ctx)
  if (!account) throw new HttpError(401, 'not_authenticated', 'Connecte-toi pour accéder à cette page.')
  return account
}

function generatedPlayer(account, today) {
  if (!account.seed) return null
  return demoWorld(today).find((p) => p.demo && p.username === account.seed) || null
}

function publicUser(account, today) {
  return { username: account.username, createdAt: account.createdAt || generatedPlayer(account, today)?.createdAt || today }
}

// Ce que la session dit du joueur connecté : de quoi afficher son Tux et ses points partout.
function sessionUser(ctx, account) {
  const results = resultsOf(account, ctx.today)
  const points = accountPoints(account, ctx.today)
  const stage = stageFor(points)
  const streak = streakOf(results, ctx.today, frozenOf(account))
  return {
    ...publicUser(account, ctx.today),
    points,
    stage: { level: stage.level, name: stage.name },
    streak: { current: streak.current, playedToday: streak.playedToday },
  }
}

function isTaken(ctx, username, except = null) {
  const key = username.toLowerCase()
  if (ctx.db.accounts[key] && ctx.db.accounts[key] !== except) return true
  return demoWorld(ctx.today).some((p) => !p.demo && p.username.toLowerCase() === key)
}

function usernameProblem(username) {
  const { minLength, maxLength } = ACCOUNT_RULES.username
  if (!username) return 'Choisis un pseudo.'
  if (username.length < minLength) return `Ton pseudo doit faire au moins ${minLength} caractères.`
  if (username.length > maxLength) return `Ton pseudo doit faire au plus ${maxLength} caractères.`
  if (!/^[\p{L}\p{N}._-]+$/u.test(username)) return 'Lettres, chiffres, point, tiret et tiret bas seulement, sans espace.'
  return null
}

function passwordProblem(password, username) {
  const { minBits, maxLength, maxBytes } = ACCOUNT_RULES.password
  if (typeof password !== 'string' || !password) return 'Choisis un mot de passe.'
  if ([...password].length > maxLength || new TextEncoder().encode(password).length > maxBytes) {
    return `Trop long : ${maxLength} caractères au plus (un peu moins avec beaucoup d’accents).`
  }
  const simplified = password.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  const name = (username || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  if (name.length >= 3 && simplified.includes(name)) return 'Ton mot de passe ne doit pas contenir ton pseudo.'
  const withoutDigits = simplified.replace(/\d+/g, '')
  if (new Set(password).size < 5 || GUESSABLE_PASSWORDS.some((word) => withoutDigits === word || simplified === word)) {
    return 'Trop facile à deviner : c’est le genre de mot de passe que les pirates essaient en premier.'
  }
  if (passwordBits(password) < minBits) {
    return 'Pas encore assez solide. Allonge-le : une phrase de passe de plusieurs mots, ou 12 caractères mêlant majuscules, minuscules, chiffres et signes.'
  }
  return null
}

const DAY_MS = 24 * 60 * 60 * 1000

// Secondes à attendre avant le prochain essai, d'après les échecs des dernières 24 heures.
function lockedFor(failures, now) {
  const { freeFailures, firstDelaySeconds, maxFailuresPerDay } = ACCOUNT_RULES.login
  if (failures.length >= maxFailuresPerDay) {
    return Math.ceil((failures[failures.length - maxFailuresPerDay] + DAY_MS - now) / 1000)
  }
  if (failures.length < freeFailures) return 0
  const delay = firstDelaySeconds * 2 ** (failures.length - freeFailures)
  return Math.ceil((failures[failures.length - 1] + delay * 1000 - now) / 1000)
}

function formatDelay(seconds) {
  if (seconds < 60) return `${seconds} secondes`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`
  const hours = Math.ceil(minutes / 60)
  return hours === 1 ? '1 heure' : `${hours} heures`
}

function readCredentials(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  return { username, password }
}

// Les réponses données sans compte rejoignent le compte au moment où l'on s'inscrit ou se
// connecte : la mission du jour compte, les rattrapages restent des rattrapages.
function claimGuestAttempts(ctx, account) {
  const guest = ctx.db.session.guest || {}
  let claimed = null
  for (const [date, attempt] of Object.entries(guest)) {
    if (!Object.keys(attempt.answers || {}).length) continue
    const alreadyPlayed = account.results[date] || generatedPlayer(account, ctx.today)?.results[date]
    if (date === ctx.today && !alreadyPlayed) {
      account.results[date] = { answers: attempt.answers }
      completeIfFinished(ctx, account, date)
      const stored = account.results[date]
      claimed = { date, answered: Object.keys(stored.answers).length, completed: Boolean(stored.completedAt), points: stored.points ?? 0 }
    } else if (date !== ctx.today && !alreadyPlayed && !account.practice[date]) {
      account.practice[date] = attempt
    }
  }
  ctx.db.session.guest = {}
  return claimed
}

route('GET', '/session', (ctx) => {
  const account = currentAccount(ctx)
  return { user: account ? sessionUser(ctx, account) : null }
})

route('GET', '/auth/rules', () => ({
  username: ACCOUNT_RULES.username,
  password: ACCOUNT_RULES.password,
}))

route('POST', '/auth/signup', (ctx) => {
  const { username, password } = readCredentials(ctx.body)
  const fields = {}
  const usernameIssue = usernameProblem(username)
  if (usernameIssue) fields.username = usernameIssue
  else if (isTaken(ctx, username)) fields.username = 'Ce pseudo est déjà pris. Ajoute une touche perso : un chiffre, un point…'
  const passwordIssue = passwordProblem(password, username)
  if (passwordIssue) fields.password = passwordIssue
  if (Object.keys(fields).length) {
    const taken = fields.username && !usernameIssue && !passwordIssue
    throw new HttpError(taken ? 409 : 400, taken ? 'username_taken' : 'invalid', 'Le formulaire contient des erreurs.', fields)
  }

  const salt = randomSalt()
  const account = {
    username,
    salt,
    hash: sha256(`${salt}:${password}`),
    createdAt: ctx.today,
    seed: null,
    results: {},
    practice: {},
    // Ce que le visiteur a fait sans compte (leçons, sardines…) devient à lui.
    progress: ctx.db.session.progress || newProgress(),
  }
  ctx.db.session.progress = null
  ctx.db.accounts[username.toLowerCase()] = account
  ctx.db.session.username = username
  const claimed = claimGuestAttempts(ctx, account)
  return reply(201, { user: sessionUser(ctx, account), claimed })
})

route('POST', '/auth/login', (ctx) => {
  const { username, password } = readCredentials(ctx.body)
  if (!username || !password) {
    const fields = {}
    if (!username) fields.username = 'Indique ton pseudo.'
    if (!password) fields.password = 'Indique ton mot de passe.'
    throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', fields)
  }

  const key = username.toLowerCase()
  const now = Date.now()
  const failures = (ctx.db.failures[key] || []).filter((t) => now - t < DAY_MS)
  const retryAfter = lockedFor(failures, now)
  if (retryAfter > 0) {
    throw new HttpError(429, 'too_many_attempts', `Trop d’essais ratés. Réessaie dans ${formatDelay(retryAfter)}.`, { retryAfter })
  }

  const account = ctx.db.accounts[key]
  if (!account || !passwordMatches(account, password)) {
    ctx.db.failures[key] = [...failures, now]
    throw new HttpError(401, 'bad_credentials', 'Pseudo ou mot de passe incorrect.')
  }

  delete ctx.db.failures[key]
  ctx.db.session.username = account.username
  const claimed = claimGuestAttempts(ctx, account)
  return { user: sessionUser(ctx, account), claimed }
})

route('POST', '/auth/logout', (ctx) => {
  ctx.db.session = { username: null, guest: {}, progress: null }
})

// ---------------------------------------------------------------------------------------
// Joueurs, points, séries et classements

function zonesOf(value, found = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\{\{(\w[\w-]*)\|/g)) if (!found.includes(match[1])) found.push(match[1])
  } else if (Array.isArray(value)) {
    value.forEach((item) => zonesOf(item, found))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => zonesOf(item, found))
  }
  return found
}

function flagsOf(mission, attempt) {
  return mission.questions.map((q) => Boolean(attempt.answers[q.id]?.correct))
}

// Tous les résultats qui comptent pour un compte : son passé simulé, puis ce qu'il a joué ici.
function resultsOf(account, today) {
  const results = { ...(generatedPlayer(account, today)?.results || {}) }
  for (const [date, attempt] of Object.entries(account.results)) {
    if (!attempt.completedAt) continue
    const flags = flagsOf(missionForDate(date), attempt)
    results[date] = { flags, correct: flags.filter(Boolean).length, total: flags.length, points: attempt.points }
  }
  return results
}

function playersOf(ctx) {
  const bots = demoWorld(ctx.today).filter((p) => !p.demo)
  const accounts = Object.values(ctx.db.accounts).map((account) => ({
    username: account.username,
    results: resultsOf(account, ctx.today),
    extra: lessonPointsByDate(account.progress),
    frozen: frozenOf(account),
    account,
  }))
  return [...bots, ...accounts]
}

function sumPoints(results, fromDate = null) {
  let total = 0
  for (const [date, result] of Object.entries(results)) if (!fromDate || date >= fromDate) total += result.points
  return total
}

// Tous les points d'un joueur depuis une date : missions du jour et leçons du parcours.
function pointsOf(player, fromDate = null) {
  let total = sumPoints(player.results, fromDate)
  for (const [date, points] of Object.entries(player.extra || {})) if (!fromDate || date >= fromDate) total += points
  return total
}

function accountPoints(account, today, fromDate = null) {
  return pointsOf({ results: resultsOf(account, today), extra: lessonPointsByDate(account.progress) }, fromDate)
}

// Série en cours : elle reste vivante tant que la journée n'est pas finie. Les jours gelés par
// un glaçon (`frozen`) la prolongent sans rapporter de points.
function streakOf(results, today, frozen = []) {
  const played = Object.keys(results)
  const dates = new Set([...played, ...frozen])
  let current = 0
  let cursor = dates.has(today) ? today : addDays(today, -1)
  while (dates.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  let best = 0
  let run = 0
  let previous = null
  for (const date of [...dates].sort()) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  const lastPlayed = played.sort().at(-1) || null
  return { current, best, playedToday: Boolean(results[today]), lastPlayed }
}

// Série au soir d'une date donnée (sert au bonus de série de cette date-là).
function streakAt(results, date, frozen = []) {
  let streak = 0
  let cursor = date
  while (results[cursor] || frozen.includes(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

const PERIODS = {
  week: (today) => addDays(today, -6),
  all: () => null,
}

function ranking(players, period, today) {
  const from = PERIODS[period](today)
  const rows = players
    .map((p) => ({
      username: p.username,
      points: pointsOf(p, from),
      level: stageFor(pointsOf(p)).level,
      streak: streakOf(p.results, today, p.frozen).current,
      account: p.account || null,
    }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username, 'fr'))
  rows.forEach((row, i) => {
    row.rank = i > 0 && rows[i - 1].points === row.points ? rows[i - 1].rank : i + 1
  })
  return rows
}

function publicRow(row, me) {
  return { rank: row.rank, username: row.username, points: row.points, level: row.level, streak: row.streak, me: Boolean(me && row.account === me) }
}

function aheadOf(rows, mine) {
  const above = rows.filter((row) => row.points > mine.points)
  const target = above.at(-1)
  return target ? { username: target.username, rank: target.rank, level: target.level, gap: target.points - mine.points } : null
}

// Le prochain épisode qui peut rapporter des points au joueur (celui du jour s'il ne l'a pas
// encore joué, sinon celui de demain) et ce qu'il rapporte au plus, série comprise.
function nextChance(ctx, results, frozen = []) {
  const streak = streakOf(results, ctx.today, frozen)
  const date = streak.playedToday ? addDays(ctx.today, 1) : ctx.today
  const count = missionForDate(date).questions.length
  return { date, maxPoints: missionPoints(count, count, streak.current + 1).total }
}

route('GET', '/leaderboard', (ctx) => {
  const period = ctx.query.get('period') || 'week'
  if (!PERIODS[period]) throw new HttpError(400, 'invalid_period', 'Période inconnue : « week » ou « all ».')
  const me = currentAccount(ctx)
  const rows = ranking(playersOf(ctx), period, ctx.today)
  const index = me ? rows.findIndex((row) => row.account === me) : -1
  const mine = index >= 0 ? rows[index] : null
  return {
    period,
    from: PERIODS[period](ctx.today) || launchDate(ctx.today),
    to: ctx.today,
    players: rows.length,
    top: rows.slice(0, 10).map((row) => publicRow(row, me)),
    around: mine && index >= 10 ? rows.slice(Math.max(10, index - 2), index + 3).map((row) => publicRow(row, me)) : [],
    me: mine ? { ...publicRow(mine, me), ahead: aheadOf(rows, mine), next: nextChance(ctx, resultsOf(me, ctx.today), frozenOf(me)) } : null,
  }
})

// ---------------------------------------------------------------------------------------
// Missions

function episodeNumber(date, today) {
  return daysBetween(launchDate(today), date) + 1
}

function guestOf(mission) {
  const guest = GANG[mission.guest]
  return { id: guest.id, name: guest.name, tagline: guest.tagline, look: guest.look }
}

function villainOf(mission) {
  return mission.villain ? { id: mission.villain, name: VILLAIN.name, disguise: DISGUISES[mission.villain] } : null
}

function publicQuestion(question) {
  const { id, kind, scene, line, artifact, prompt, options, pick } = question
  return {
    id,
    kind,
    scene,
    line: line || null,
    artifact: artifact || null,
    prompt,
    ...(kind === 'choice' ? { options } : {}),
    ...(kind === 'clues' ? { pick } : {}),
  }
}

function publicMission(mission, date, today) {
  return {
    date,
    number: episodeNumber(date, today),
    title: mission.title,
    theme: mission.theme,
    hook: mission.hook,
    guest: guestOf(mission),
    questions: mission.questions.map(publicQuestion),
  }
}

function publishedMission(ctx, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isPublished(date, ctx.today)) {
    throw new HttpError(404, 'mission_not_found', 'Aucun épisode n’est paru à cette date.')
  }
  return missionForDate(date)
}

function teaser(ctx) {
  const date = addDays(ctx.today, 1)
  const mission = missionForDate(date)
  return { date, number: episodeNumber(date, ctx.today), hook: mission.hook, guest: guestOf(mission), villain: villainOf(mission) }
}

// Ce que le joueur a déjà donné comme réponse pour la mission d'une date, et à quel titre :
//   counted   la mission du jour (ou une mission jouée le jour même) : elle rapporte des points
//   guest     la mission du jour, jouée sans compte : rien n'est gardé tant qu'on ne s'inscrit pas
//   practice  un épisode passé, rattrapé pour s'entraîner : aucun point
function attemptFor(ctx, date, { create = false } = {}) {
  const account = currentAccount(ctx)
  const mission = missionForDate(date)
  const isToday = date === ctx.today
  if (account) {
    let stored = account.results[date]
    if (stored && !stored.completedAt && !isToday) {
      // Commencée hier, pas finie avant minuit : elle devient un rattrapage.
      account.practice[date] = account.practice[date] || stored
      delete account.results[date]
      stored = null
    }
    if (stored) return { mode: 'counted', attempt: stored, account }
    const generated = generatedPlayer(account, ctx.today)?.results[date]
    if (generated) return { mode: 'counted', attempt: attemptFromFlags(mission, generated), account, readOnly: true }
    if (isToday) {
      if (create) account.results[date] = { answers: {} }
      return { mode: 'counted', attempt: account.results[date] || null, account }
    }
    if (create && !account.practice[date]) account.practice[date] = { answers: {} }
    return { mode: 'practice', attempt: account.practice[date] || null, account }
  }
  const guest = ctx.db.session.guest
  if (create && !guest[date]) guest[date] = { answers: {} }
  return { mode: isToday ? 'guest' : 'practice', attempt: guest[date] || null }
}

// Le passé simulé ne garde que juste/faux : on en déduit des réponses plausibles à relire.
function attemptFromFlags(mission, generated) {
  const answers = {}
  mission.questions.forEach((question, i) => {
    const correct = generated.flags[i]
    answers[question.id] = { answer: correct ? question.answer : wrongAnswer(question), correct }
  })
  return { answers, points: generated.points, completedAt: 'simulated' }
}

function wrongAnswer(question) {
  switch (question.kind) {
    case 'trap':
      return question.answer === 'trap' ? 'safe' : 'trap'
    case 'truefalse':
      return !question.answer
    case 'choice':
      return question.options.find((o) => o.id !== question.answer).id
    case 'clues': {
      const decoy = zonesOf(question.artifact).find((zone) => !question.answer.includes(zone))
      return [...question.answer.slice(0, question.pick - 1), decoy]
    }
  }
  return null
}

function checkAnswer(question, answer) {
  const invalid = () => new HttpError(400, 'invalid_answer', 'Cette réponse ne correspond pas à la question.')
  // null : le joueur passe la question, elle compte comme une erreur.
  if (answer === null) return false
  switch (question.kind) {
    case 'trap':
      if (answer !== 'trap' && answer !== 'safe') throw invalid()
      return answer === question.answer
    case 'truefalse':
      if (typeof answer !== 'boolean') throw invalid()
      return answer === question.answer
    case 'choice':
      if (!question.options.some((o) => o.id === answer)) throw invalid()
      return answer === question.answer
    case 'clues': {
      const zones = zonesOf(question.artifact)
      const valid =
        Array.isArray(answer) &&
        answer.length === question.pick &&
        new Set(answer).size === answer.length &&
        answer.every((zone) => zones.includes(zone))
      if (!valid) throw invalid()
      return answer.every((zone) => question.answer.includes(zone))
    }
  }
  throw invalid()
}

// Part des joueurs qui ont répondu juste à chaque question de la mission d'une date.
function successRates(ctx, date, mission) {
  const played = playersOf(ctx).filter((p) => p.results[date]?.flags)
  return mission.questions.map((question, i) => {
    if (!played.length) return Math.round(question.success * 100)
    return Math.round((played.filter((p) => p.results[date].flags[i]).length / played.length) * 100)
  })
}

function revealed(question, entry, success) {
  return {
    answer: entry.answer,
    correct: entry.correct,
    solution: question.answer,
    explanation: question.explanation,
    notes: question.notes || [],
    success,
  }
}

function progressOf(ctx, date, mission, resolved) {
  const answers = {}
  const rates = resolved.attempt ? successRates(ctx, date, mission) : []
  mission.questions.forEach((question, i) => {
    const entry = resolved.attempt?.answers[question.id]
    if (entry) answers[question.id] = revealed(question, entry, rates[i])
  })
  const answered = Object.keys(answers).length
  return { mode: resolved.mode, answers, answered, total: mission.questions.length, completed: answered === mission.questions.length }
}

function completeIfFinished(ctx, account, date) {
  const attempt = account.results[date]
  const mission = missionForDate(date)
  if (!attempt || attempt.completedAt || Object.keys(attempt.answers).length < mission.questions.length) return
  const previous = resultsOf(account, ctx.today)
  delete previous[date]
  const streak = streakAt(previous, addDays(date, -1), frozenOf(account)) + 1
  const correct = flagsOf(mission, attempt).filter(Boolean).length
  attempt.points = missionPoints(correct, mission.questions.length, streak).total
  attempt.completedAt = new Date().toISOString()
}

function stats(ctx, date) {
  const played = playersOf(ctx).filter((p) => p.results[date])
  const questions = played.reduce((sum, p) => sum + p.results[date].total, 0)
  const correct = played.reduce((sum, p) => sum + p.results[date].correct, 0)
  return { players: played.length, successRate: questions ? Math.round((correct / questions) * 100) : null }
}

route('GET', '/missions/today', (ctx) => {
  const mission = missionForDate(ctx.today)
  return {
    mission: publicMission(mission, ctx.today, ctx.today),
    progress: progressOf(ctx, ctx.today, mission, attemptFor(ctx, ctx.today)),
    stats: stats(ctx, ctx.today),
    next: teaser(ctx),
  }
})

route('GET', '/missions', (ctx) => {
  const account = currentAccount(ctx)
  const results = account ? resultsOf(account, ctx.today) : {}
  const joined = account ? publicUser(account, ctx.today).createdAt : null
  const episodes = publishedDates(ctx.today).map((date) => {
    const mission = missionForDate(date)
    const resolved = attemptFor(ctx, date)
    const answered = Object.keys(resolved.attempt?.answers || {}).length
    const total = mission.questions.length
    let status
    if (results[date]) status = 'played'
    else if (answered === total) status = 'practiced'
    else if (answered > 0) status = 'started'
    else if (date === ctx.today) status = 'today'
    else if (account && date >= joined) status = 'missed'
    else status = 'unplayed'
    const attemptFlags = resolved.attempt ? flagsOf(mission, resolved.attempt) : null
    return {
      date,
      number: episodeNumber(date, ctx.today),
      title: mission.title,
      theme: mission.theme,
      guest: guestOf(mission),
      villain: status === 'played' || status === 'practiced' ? villainOf(mission) : null,
      questionCount: total,
      status,
      score:
        status === 'played'
          ? { correct: results[date].correct, total, points: results[date].points }
          : status === 'practiced'
            ? { correct: attemptFlags.filter(Boolean).length, total, points: 0 }
            : null,
      stats: stats(ctx, date),
    }
  })
  return { episodes }
})

route('GET', '/missions/:date', (ctx) => {
  const { date } = ctx.params
  const mission = publishedMission(ctx, date)
  return {
    mission: publicMission(mission, date, ctx.today),
    progress: progressOf(ctx, date, mission, attemptFor(ctx, date)),
  }
})

route('POST', '/missions/:date/answers', (ctx) => {
  const { date } = ctx.params
  const mission = publishedMission(ctx, date)
  const index = mission.questions.findIndex((q) => q.id === ctx.body.questionId)
  if (index < 0) throw new HttpError(404, 'question_not_found', 'Cette question ne fait pas partie de l’épisode.')
  const question = mission.questions[index]

  const existing = attemptFor(ctx, date)
  if (existing.readOnly) throw new HttpError(409, 'already_completed', 'Tu as déjà joué cet épisode.')
  if (existing.attempt?.answers[question.id]) {
    throw new HttpError(409, 'already_answered', 'Tu as déjà répondu à cette question.')
  }
  const correct = checkAnswer(question, ctx.body.answer)
  const resolved = attemptFor(ctx, date, { create: true })
  resolved.attempt.answers[question.id] = { answer: ctx.body.answer, correct }
  if (resolved.mode === 'counted') completeIfFinished(ctx, resolved.account, date)

  const progress = progressOf(ctx, date, mission, resolved)
  if (progress.completed && date === ctx.today) settleQuests(ctx)
  return { ...progress.answers[question.id], progress: { ...progress, answers: undefined } }
})

route('GET', '/missions/:date/result', (ctx) => {
  const { date } = ctx.params
  const mission = publishedMission(ctx, date)
  const resolved = attemptFor(ctx, date)
  const total = mission.questions.length
  const answered = Object.keys(resolved.attempt?.answers || {}).length
  if (answered < total) throw new HttpError(409, 'not_finished', 'Réponds à toutes les cases pour voir la fin de l’épisode.')

  const correct = flagsOf(mission, resolved.attempt).filter(Boolean).length
  const result = {
    date,
    number: episodeNumber(date, ctx.today),
    title: mission.title,
    mode: resolved.mode,
    correct,
    total,
    moral: mission.moral,
    sources: mission.sources,
    villain: villainOf(mission) && { ...villainOf(mission), quip: VILLAIN.quips[dayNumber(date) % VILLAIN.quips.length] },
    points: null,
    player: null,
    rank: null,
    next: teaser(ctx),
  }

  if (resolved.mode === 'guest') {
    // Ce que le visiteur gagnerait s'il créait son compte maintenant (premier jour de série).
    result.points = missionPoints(correct, total, 1)
  }

  if (resolved.mode === 'counted') {
    const { account } = resolved
    const results = resultsOf(account, ctx.today)
    result.points = missionPoints(correct, total, streakAt(results, date, frozenOf(account)))
    // Le joueur avant et après l'épisode du jour : de quoi montrer son Tux grandir.
    if (date === ctx.today) {
      const after = accountPoints(account, ctx.today)
      const before = after - results[date].points
      const streak = streakOf(results, ctx.today, frozenOf(account))
      result.player = {
        before: { points: before, stage: stageFor(before) },
        after: { points: after, stage: stageFor(after) },
        streak: { current: streak.current, best: streak.best },
      }
      const players = playersOf(ctx)
      const rowsAfter = ranking(players, 'week', ctx.today)
      const withoutToday = players.map((p) => {
        if (p.account !== account) return p
        const { [date]: _, ...rest } = p.results
        return { ...p, results: rest }
      })
      const rowsBefore = ranking(withoutToday, 'week', ctx.today)
      const mine = rowsAfter.find((row) => row.account === account)
      const previous = rowsBefore.find((row) => row.account === account)
      result.rank = {
        period: 'week',
        position: mine.rank,
        previous: previous ? previous.rank : null,
        players: rowsAfter.length,
        ahead: aheadOf(rowsAfter, mine),
        next: nextChance(ctx, results, frozenOf(account)),
      }
    }
  }
  return result
})

// ---------------------------------------------------------------------------------------
// Profil

route('GET', '/me', (ctx) => {
  const account = requireAccount(ctx)
  const results = resultsOf(account, ctx.today)
  const points = accountPoints(account, ctx.today)
  const stage = stageFor(points)
  const players = playersOf(ctx)
  const rankIn = (period) => {
    const rows = ranking(players, period, ctx.today)
    const mine = rows.find((row) => row.account === account)
    return mine ? { position: mine.rank, players: rows.length } : null
  }
  const user = publicUser(account, ctx.today)
  const days = publishedDates(ctx.today)
    .reverse()
    .map((date) => {
      const result = results[date]
      let status = result ? 'played' : date === ctx.today ? 'today' : date < user.createdAt ? 'before' : 'missed'
      return { date, number: episodeNumber(date, ctx.today), title: missionForDate(date).title, status, ...(result ? { correct: result.correct, total: result.total, points: result.points } : {}) }
    })
  const played = Object.values(results)
  return {
    user,
    points,
    stage: { ...stage, motto: STAGES[stage.level].motto },
    streak: streakOf(results, ctx.today, frozenOf(account)),
    rank: { week: rankIn('week'), all: rankIn('all') },
    totals: {
      episodes: played.length,
      correct: played.reduce((sum, r) => sum + r.correct, 0),
      questions: played.reduce((sum, r) => sum + r.total, 0),
      lessons: (account.progress?.history || []).filter((entry) => entry.points > 0).length,
    },
    // Les points des sept derniers jours, pour le graphique de la semaine.
    week: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(ctx.today, i - 6)
      return { date, points: accountPoints(account, ctx.today, date) - accountPoints(account, ctx.today, addDays(date, 1)) }
    }),
    achievements: achievementsOf(ctx, account),
    days,
  }
})

// Les comptes de démonstration ont un mot de passe public : on ne les renomme pas, on ne change
// pas leur mot de passe et on ne les supprime pas.
function refuseDemo(account) {
  if (DEMO_ACCOUNTS.some((demo) => demo.username.toLowerCase() === account.username.toLowerCase())) {
    throw new HttpError(403, 'demo_account', 'Les comptes de démonstration ne se modifient pas : crée ton propre profil pour essayer.')
  }
}

route('PATCH', '/me', (ctx) => {
  const account = requireAccount(ctx)
  refuseDemo(account)
  const username = typeof ctx.body.username === 'string' ? ctx.body.username.trim() : ''
  const issue = usernameProblem(username)
  if (issue) throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', { username: issue })
  if (isTaken(ctx, username, account)) {
    throw new HttpError(409, 'username_taken', 'Le formulaire contient des erreurs.', { username: 'Ce pseudo est déjà pris.' })
  }
  delete ctx.db.accounts[account.username.toLowerCase()]
  account.username = username
  ctx.db.accounts[username.toLowerCase()] = account
  ctx.db.session.username = username
  return { user: sessionUser(ctx, account) }
})

route('PUT', '/me/password', (ctx) => {
  const account = requireAccount(ctx)
  refuseDemo(account)
  const { currentPassword, newPassword } = ctx.body
  if (!passwordMatches(account, currentPassword)) {
    throw new HttpError(403, 'wrong_password', 'Le formulaire contient des erreurs.', { currentPassword: 'Ce n’est pas ton mot de passe actuel.' })
  }
  const issue = passwordProblem(newPassword, account.username)
  if (issue) throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', { newPassword: issue })
  if (newPassword === currentPassword) {
    throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', { newPassword: 'Choisis un mot de passe différent de l’actuel.' })
  }
  account.salt = randomSalt()
  account.hash = sha256(`${account.salt}:${newPassword}`)
})

route('DELETE', '/me', (ctx) => {
  const account = requireAccount(ctx)
  refuseDemo(account)
  if (!passwordMatches(account, ctx.body.password)) {
    throw new HttpError(403, 'wrong_password', 'Le formulaire contient des erreurs.', { password: 'Ce n’est pas ton mot de passe.' })
  }
  delete ctx.db.accounts[account.username.toLowerCase()]
  ctx.db.session = { username: null, guest: {}, progress: null }
})

// ---------------------------------------------------------------------------------------
// Le parcours, la réserve et les quêtes
//
// Chaque joueur, avec ou sans compte, a sa progression dans le parcours :
//   history  leçons et bilans terminés : [{ id, date, correct, total, points }]
//            (une leçon refaite s'y ajoute avec 0 point)
//   attempt  la leçon en cours : { id, answers, result? } (une seule à la fois)
//   chests   coffres ouverts : [id]
//   sardines, buoys { count, day }, freezes, frozen [dates gelées]
//   quests   quêtes déjà récompensées : { [date ou mois]: [id] }
// Le visiteur sans compte la garde dans sa session ; elle rejoint le compte qu'il crée.

function newProgress() {
  return {
    history: [],
    attempt: null,
    chests: [],
    sardines: STARTING_SARDINES,
    buoys: { count: MAX_BUOYS, day: null },
    freezes: 0,
    frozen: [],
    quests: {},
  }
}

// La progression du joueur de la requête, créée au besoin.
function ownProgress(ctx) {
  const account = currentAccount(ctx)
  if (account) return (account.progress ||= newProgress())
  return (ctx.db.session.progress ||= newProgress())
}

function frozenOf(account) {
  return account.progress?.frozen || []
}

function lessonPointsByDate(progress) {
  const byDate = {}
  for (const entry of progress?.history || []) byDate[entry.date] = (byDate[entry.date] || 0) + entry.points
  return byDate
}

// Les bouées se regonflent chaque nuit.
function buoysOf(progress, today) {
  if (progress.buoys.day !== today) progress.buoys = { count: MAX_BUOYS, day: today }
  return progress.buoys.count
}

// Les glaçons gèlent les jours manqués depuis la dernière mission du jour, s'il y en a assez pour
// tous les couvrir. Sinon la série est perdue, et les glaçons restent en réserve.
function applyFreezes(ctx) {
  const account = currentAccount(ctx)
  if (!account?.progress?.freezes) return
  const progress = account.progress
  const played = Object.keys(resultsOf(account, ctx.today))
  const last = [...played, ...progress.frozen].sort().at(-1)
  if (!last) return
  const missed = daysBetween(last, ctx.today) - 1
  if (missed < 1 || missed > progress.freezes) return
  for (let i = 1; i <= missed; i++) progress.frozen.push(addDays(last, i))
  progress.freezes -= missed
}

function doneIds(progress) {
  return new Set([...progress.history.map((entry) => entry.id), ...progress.chests])
}

// La première étape pas encore franchie : tout ce qui la précède est fait, tout ce qui la suit
// est verrouillé.
function currentNode(progress) {
  const done = doneIds(progress)
  return NODES.find((node) => !done.has(node.id)) || null
}

function nodeStatus(node, progress) {
  if (doneIds(progress).has(node.id)) return 'done'
  return currentNode(progress)?.id === node.id ? 'current' : 'locked'
}

function guestCard(id) {
  const guest = GANG[id]
  return guest ? { id: guest.id, name: guest.name, tagline: guest.tagline, look: guest.look } : null
}

function inventory(ctx) {
  const account = currentAccount(ctx)
  const progress = ownProgress(ctx)
  const results = account ? resultsOf(account, ctx.today) : {}
  const points = account
    ? accountPoints(account, ctx.today)
    : progress.history.reduce((total, entry) => total + entry.points, 0)
  const stage = stageFor(points)
  const streak = account ? streakOf(results, ctx.today, frozenOf(account)) : { current: 0, playedToday: false }
  return {
    points,
    stage: { level: stage.level, name: stage.name },
    streak: { current: streak.current, playedToday: streak.playedToday },
    sardines: progress.sardines,
    buoys: { count: buoysOf(progress, ctx.today), max: MAX_BUOYS },
    freezes: { count: progress.freezes, max: MAX_FREEZES },
  }
}

route('GET', '/inventory', (ctx) => inventory(ctx))

// La mission du jour, en tête du chemin.
function dailyCard(ctx) {
  const mission = missionForDate(ctx.today)
  const resolved = attemptFor(ctx, ctx.today)
  const answered = Object.keys(resolved.attempt?.answers || {}).length
  const total = mission.questions.length
  const account = resolved.account
  const results = account ? resultsOf(account, ctx.today) : {}
  const played = results[ctx.today]
  const streak = account ? streakOf(results, ctx.today, frozenOf(account)) : { current: 0 }
  return {
    date: ctx.today,
    number: episodeNumber(ctx.today, ctx.today),
    title: mission.title,
    theme: mission.theme,
    hook: mission.hook,
    guest: guestOf(mission),
    status: played || answered === total ? 'done' : answered ? 'started' : 'todo',
    answered,
    total,
    points: played ? played.points : null,
    maxPoints: missionPoints(total, total, played ? streak.current : streak.current + 1).total,
    players: stats(ctx, ctx.today).players,
  }
}

route('GET', '/path', (ctx) => {
  const progress = ownProgress(ctx)
  const current = currentNode(progress)
  const bestOf = (id) => {
    const entry = progress.history.find((e) => e.id === id)
    return entry ? { correct: entry.correct, total: entry.total } : null
  }
  const units = UNITS.map((unit, i) => {
    const nodes = NODES.filter((node) => node.unit === unit.id).map((node) => {
      const lesson = node.type === 'chest' ? null : lessonContent(node.id)
      return {
        type: node.type,
        id: node.id,
        title: node.type === 'chest' ? 'Coffre' : lesson.title,
        guest: node.type === 'lesson' ? guestCard(lesson.guest) : null,
        status: nodeStatus(node, progress),
        score: node.type === 'chest' ? null : bestOf(node.id),
        maxPoints: lesson ? lessonPoints(lesson.questions.length, lesson.questions.length, { review: node.type === 'review' }).total : null,
      }
    })
    return {
      id: unit.id,
      number: i + 1,
      title: unit.title,
      description: unit.description,
      color: unit.color,
      villain: unit.villain,
      status: nodes.every((n) => n.status === 'done') ? 'done' : nodes.some((n) => n.status !== 'locked') ? 'current' : 'locked',
      nodes,
    }
  })
  const lessons = NODES.filter((node) => node.type !== 'chest')
  return {
    daily: dailyCard(ctx),
    units,
    current: current ? { type: current.type, id: current.id, unit: current.unit } : null,
    lessons: { done: lessons.filter((node) => doneIds(progress).has(node.id)).length, total: lessons.length },
  }
})

// Le guide d'un thème : le réflexe à retenir de chaque leçon, et les sources officielles.
route('GET', '/units/:id/guide', (ctx) => {
  const unit = unitById(ctx.params.id)
  if (!unit) throw new HttpError(404, 'unit_not_found', 'Ce thème n’existe pas.')
  const review = lessonContent(`bilan-${unit.id}`)
  return {
    unit: { id: unit.id, number: UNITS.indexOf(unit) + 1, title: unit.title, description: unit.description, color: unit.color, villain: unit.villain },
    reflexes: review.reflexes,
    sources: unit.missions.flatMap((id) => lessonContent(id).sources || []).filter((s, i, all) => all.findIndex((o) => o.url === s.url) === i),
  }
})

function lessonOrThrow(id) {
  const lesson = lessonContent(id)
  if (!lesson) throw new HttpError(404, 'lesson_not_found', 'Cette leçon n’existe pas.')
  return lesson
}

function publicLesson(lesson) {
  return {
    id: lesson.id,
    kind: lesson.kind,
    title: lesson.title,
    theme: lesson.theme,
    hook: lesson.hook,
    unit: { id: lesson.unit.id, title: lesson.unit.title, color: lesson.unit.color },
    guest: lesson.guest ? guestCard(lesson.guest) : null,
    questions: lesson.questions.map((question) => ({ ...publicQuestion(question), guest: guestCard(question.guest) })),
  }
}

function lessonProgress(lesson, attempt) {
  const answers = {}
  for (const question of lesson.questions) {
    const entry = attempt?.answers[question.id]
    if (entry) answers[question.id] = revealed(question, entry, Math.round(question.success * 100))
  }
  const answered = Object.keys(answers).length
  return { answers, answered, total: lesson.questions.length, completed: answered === lesson.questions.length }
}

// Commencer une leçon, ou reprendre celle qui est en cours. Une leçon déjà faite se refait :
// elle ne rapporte plus rien, mais entraîne.
route('POST', '/lessons/:id/start', (ctx) => {
  const lesson = lessonOrThrow(ctx.params.id)
  const progress = ownProgress(ctx)
  const status = nodeStatus(nodeById(lesson.id), progress)
  if (status === 'locked') throw new HttpError(403, 'lesson_locked', 'Termine d’abord les étapes précédentes du parcours.')
  const resume = progress.attempt?.id === lesson.id && !progress.attempt.result
  if (!resume) {
    if (buoysOf(progress, ctx.today) < 1) throw new HttpError(409, 'no_buoys', 'Tu n’as plus de bouée. Elles se regonflent cette nuit, ou à la boutique.')
    progress.attempt = { id: lesson.id, answers: {}, replay: status === 'done' }
  }
  return {
    lesson: publicLesson(lesson),
    progress: lessonProgress(lesson, progress.attempt),
    replay: progress.attempt.replay,
    buoys: { count: buoysOf(progress, ctx.today), max: MAX_BUOYS },
  }
})

route('POST', '/lessons/:id/answers', (ctx) => {
  const lesson = lessonOrThrow(ctx.params.id)
  const progress = ownProgress(ctx)
  const attempt = progress.attempt
  if (attempt?.id !== lesson.id || attempt.result) {
    throw new HttpError(409, 'lesson_not_started', 'Cette leçon n’est pas commencée.')
  }
  const question = lesson.questions.find((q) => q.id === ctx.body.questionId)
  if (!question) throw new HttpError(404, 'question_not_found', 'Cette question ne fait pas partie de la leçon.')
  if (attempt.answers[question.id]) throw new HttpError(409, 'already_answered', 'Tu as déjà répondu à cette question.')
  if (buoysOf(progress, ctx.today) < 1) throw new HttpError(409, 'no_buoys', 'Tu n’as plus de bouée. Elles se regonflent cette nuit, ou à la boutique.')

  const correct = checkAnswer(question, ctx.body.answer)
  attempt.answers[question.id] = { answer: ctx.body.answer, correct }
  // Une erreur coûte une bouée.
  if (!correct) progress.buoys.count--
  const state = lessonProgress(lesson, attempt)
  if (state.completed) finishLesson(ctx, lesson, progress)
  return {
    ...state.answers[question.id],
    progress: { ...state, answers: undefined },
    buoys: { count: buoysOf(progress, ctx.today), max: MAX_BUOYS },
  }
})

// Fin d'une leçon : points et sardines la première fois, quêtes, et l'étape suivante. Le bilan
// est gardé tel quel avec la tentative, pour être relu.
function finishLesson(ctx, lesson, progress) {
  const attempt = progress.attempt
  const account = currentAccount(ctx)
  const correct = lesson.questions.filter((q) => attempt.answers[q.id].correct).length
  const total = lesson.questions.length
  const firstTime = !attempt.replay
  const review = lesson.kind === 'review'
  const points = firstTime ? lessonPoints(correct, total, { review }) : null
  const perfect = correct === total
  const sardines = firstTime ? (review ? SARDINES.review : SARDINES.lesson) + (perfect ? SARDINES.perfect : 0) : 0
  const before = inventory(ctx)
  progress.history.push({ id: lesson.id, date: ctx.today, correct, total, points: points ? points.total : 0 })
  progress.sardines += sardines
  const quests = settleQuests(ctx)
  const after = inventory(ctx)
  const next = currentNode(progress)
  attempt.result = {
    id: lesson.id,
    kind: lesson.kind,
    title: lesson.title,
    unit: { id: lesson.unit.id, title: lesson.unit.title, color: lesson.unit.color },
    correct,
    total,
    firstTime,
    points,
    sardines,
    moral: lesson.moral,
    reflexes: lesson.reflexes,
    sources: lesson.sources || [],
    player: account || firstTime
      ? { before: { points: before.points, stage: stageFor(before.points) }, after: { points: after.points, stage: stageFor(after.points) } }
      : null,
    quests,
    next: next ? { type: next.type, id: next.id, title: next.type === 'chest' ? 'Coffre' : lessonContent(next.id).title } : null,
  }
}

route('GET', '/lessons/:id/result', (ctx) => {
  lessonOrThrow(ctx.params.id)
  const attempt = ownProgress(ctx).attempt
  if (attempt?.id !== ctx.params.id || !attempt.result) {
    throw new HttpError(409, 'not_finished', 'Réponds à toutes les questions pour voir le bilan de la leçon.')
  }
  return attempt.result
})

route('POST', '/path/chests/:id', (ctx) => {
  const node = nodeById(ctx.params.id)
  if (!node || node.type !== 'chest') throw new HttpError(404, 'chest_not_found', 'Ce coffre n’existe pas.')
  const progress = ownProgress(ctx)
  const status = nodeStatus(node, progress)
  if (status === 'done') throw new HttpError(409, 'already_claimed', 'Tu as déjà ouvert ce coffre.')
  if (status === 'locked') throw new HttpError(403, 'chest_locked', 'Termine d’abord les leçons qui mènent à ce coffre.')
  progress.chests.push(node.id)
  progress.sardines += SARDINES.chest
  return { sardines: SARDINES.chest, inventory: inventory(ctx) }
})

// --- La boutique

const SHOP_ITEMS = [
  {
    id: 'bouees',
    title: 'Bouées regonflées',
    description: 'Retrouve tes cinq bouées tout de suite, sans attendre cette nuit.',
  },
  {
    id: 'glacon',
    title: 'Glaçon',
    description: 'Il gèle ta série un jour où tu ne fais pas la mission du jour. Tu peux en garder deux.',
  },
]

function shopItems(ctx) {
  const progress = ownProgress(ctx)
  const buoys = buoysOf(progress, ctx.today)
  return SHOP_ITEMS.map((item) => {
    const price = SHOP[item.id].price
    let blocked = null
    if (item.id === 'bouees' && buoys >= MAX_BUOYS) blocked = 'Tes bouées sont déjà toutes gonflées.'
    if (item.id === 'glacon' && progress.freezes >= MAX_FREEZES) blocked = `Tu as déjà ${MAX_FREEZES} glaçons en réserve.`
    if (!blocked && progress.sardines < price) blocked = 'Pas assez de sardines.'
    return {
      ...item,
      price,
      owned: item.id === 'glacon' ? { count: progress.freezes, max: MAX_FREEZES } : { count: buoys, max: MAX_BUOYS },
      available: !blocked,
      reason: blocked,
    }
  })
}

route('GET', '/shop', (ctx) => {
  requireAccount(ctx)
  return { sardines: ownProgress(ctx).sardines, items: shopItems(ctx) }
})

route('POST', '/shop/:id', (ctx) => {
  requireAccount(ctx)
  const item = shopItems(ctx).find((i) => i.id === ctx.params.id)
  if (!item) throw new HttpError(404, 'item_not_found', 'Cet article n’existe pas.')
  const progress = ownProgress(ctx)
  if (item.id === 'bouees' && item.owned.count >= MAX_BUOYS) throw new HttpError(409, 'already_full', item.reason)
  if (item.id === 'glacon' && item.owned.count >= MAX_FREEZES) throw new HttpError(409, 'max_reached', item.reason)
  if (progress.sardines < item.price) throw new HttpError(409, 'not_enough_sardines', 'Pas assez de sardines pour cet article.')
  progress.sardines -= item.price
  if (item.id === 'bouees') progress.buoys = { count: MAX_BUOYS, day: ctx.today }
  else progress.freezes++
  return { inventory: inventory(ctx) }
})

// --- Les quêtes

// Trois quêtes par jour : la mission du jour, et deux autres qui tournent selon la date.
const DAILY_QUESTS = {
  daily: { title: 'Fais la mission du jour', goal: 1, reward: 15 },
  points: { title: 'Gagne 40 points', goal: 40, reward: 10 },
  lessons: { title: 'Termine 2 leçons du parcours', goal: 2, reward: 15 },
  correct: { title: 'Donne 12 bonnes réponses', goal: 12, reward: 10 },
  perfect: { title: 'Fais un sans-faute', goal: 1, reward: 20 },
}
const ROTATING = ['points', 'lessons', 'correct', 'perfect']
const MONTHLY_GOAL = 120
const MONTHLY_REWARD = 50
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function questIds(today) {
  const n = dayNumber(today)
  return ['daily', ROTATING[n % ROTATING.length], ROTATING[(n + 1) % ROTATING.length]]
}

// Ce que le joueur a fait à une date (ou depuis une date, pour le défi du mois).
function activity(ctx, fromDate, toDate = fromDate) {
  const account = currentAccount(ctx)
  const progress = ownProgress(ctx)
  const inRange = (date) => date >= fromDate && date <= toDate
  const lessons = progress.history.filter((entry) => inRange(entry.date))
  const total = { points: 0, lessons: lessons.length, correct: 0, perfect: 0, daily: 0 }
  for (const entry of lessons) {
    total.points += entry.points
    total.correct += entry.correct
    if (entry.correct === entry.total) total.perfect++
  }
  if (account) {
    for (const [date, result] of Object.entries(resultsOf(account, ctx.today))) {
      if (!inRange(date)) continue
      total.points += result.points
      total.correct += result.correct
      if (result.correct === result.total) total.perfect++
      if (date === ctx.today) total.daily = 1
    }
  } else {
    const attempt = ctx.db.session.guest[ctx.today]
    const mission = missionForDate(ctx.today)
    if (attempt && inRange(ctx.today) && Object.keys(attempt.answers).length === mission.questions.length) {
      const flags = flagsOf(mission, attempt)
      total.daily = 1
      total.correct += flags.filter(Boolean).length
      if (flags.every(Boolean)) total.perfect++
    }
  }
  return total
}

function questsOf(ctx) {
  const progress = ownProgress(ctx)
  const today = activity(ctx, ctx.today)
  const credited = progress.quests[ctx.today] || []
  const daily = questIds(ctx.today).map((id) => {
    const quest = DAILY_QUESTS[id]
    const value = Math.min(quest.goal, today[id])
    return { id, title: quest.title, value, goal: quest.goal, reward: quest.reward, done: value >= quest.goal, credited: credited.includes(id) }
  })
  const month = ctx.today.slice(0, 7)
  const value = Math.min(MONTHLY_GOAL, activity(ctx, `${month}-01`, ctx.today).correct)
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return {
    daily,
    monthly: {
      id: month,
      title: /^[aeiou]/.test(MONTHS[m - 1]) ? `Le défi d’${MONTHS[m - 1]}` : `Le défi de ${MONTHS[m - 1]}`,
      description: `Donne ${MONTHLY_GOAL} bonnes réponses avant la fin du mois.`,
      value,
      goal: MONTHLY_GOAL,
      reward: MONTHLY_REWARD,
      done: value >= MONTHLY_GOAL,
      daysLeft: lastDay - Number(ctx.today.slice(8)),
    },
  }
}

// Les quêtes terminées rapportent leurs sardines une fois, dès qu'elles sont remplies.
function settleQuests(ctx) {
  const progress = ownProgress(ctx)
  const quests = questsOf(ctx)
  const earned = []
  const credit = (key, id, title, reward) => {
    progress.quests[key] ||= []
    if (progress.quests[key].includes(id)) return
    progress.quests[key].push(id)
    progress.sardines += reward
    earned.push({ id, title, reward })
  }
  for (const quest of quests.daily) if (quest.done) credit(ctx.today, quest.id, quest.title, quest.reward)
  if (quests.monthly.done) credit(quests.monthly.id, 'monthly', quests.monthly.title, quests.monthly.reward)
  return earned
}

route('GET', '/quests', (ctx) => {
  settleQuests(ctx)
  const quests = questsOf(ctx)
  return {
    date: ctx.today,
    daily: quests.daily.map(({ credited, ...quest }) => quest),
    monthly: quests.monthly,
  }
})

// --- Les succès, pour la page « Mon Tux »

const ACHIEVEMENTS = [
  { id: 'serie', title: 'Fidèle au poste', unit: 'jours de série', icon: 'flamme', tiers: [3, 7, 14, 30], metric: (s) => s.bestStreak },
  { id: 'sans-faute', title: 'Sans-faute', unit: 'sans-fautes', icon: 'cible', tiers: [1, 5, 15, 40], metric: (s) => s.perfect },
  { id: 'themes', title: 'Tour de la banquise', unit: 'thèmes terminés', icon: 'igloo', tiers: [1, 2, 4, UNITS.length], metric: (s) => s.units },
  { id: 'muscles', title: 'Gonflé à bloc', unit: 'stade du Tux', icon: 'haltere', tiers: [2, 4, 6, 7], metric: (s) => s.level },
  { id: 'missions', title: 'Mission accomplie', unit: 'missions du jour', icon: 'trophee', tiers: [1, 10, 25, 50], metric: (s) => s.missions },
]

function achievementsOf(ctx, account) {
  const progress = account.progress || newProgress()
  const results = Object.values(resultsOf(account, ctx.today))
  const done = doneIds(progress)
  const stats = {
    bestStreak: streakOf(resultsOf(account, ctx.today), ctx.today, frozenOf(account)).best,
    perfect: results.filter((r) => r.correct === r.total).length + progress.history.filter((e) => e.correct === e.total).length,
    units: UNITS.filter((unit) => done.has(`bilan-${unit.id}`)).length,
    level: stageFor(accountPoints(account, ctx.today)).level,
    missions: results.length,
  }
  return ACHIEVEMENTS.map((a) => {
    const value = a.metric(stats)
    const level = a.tiers.filter((tier) => value >= tier).length
    const goal = a.tiers[Math.min(level, a.tiers.length - 1)]
    return { id: a.id, title: a.title, icon: a.icon, level, maxLevel: a.tiers.length, value, goal, unit: a.unit }
  })
}

// ---------------------------------------------------------------------------------------
// Contenus fixes

route('GET', '/game', () => ({
  stages: STAGES,
  scoring: {
    correctAnswer: POINTS_PER_CORRECT_ANSWER,
    perfectBonus: PERFECT_BONUS,
    streakBonusPerDay: STREAK_BONUS_PER_DAY,
    streakBonusMaxDays: STREAK_BONUS_MAX_DAYS,
  },
}))

route('GET', '/cast', () => ({
  gang: Object.values(GANG),
  villain: { name: VILLAIN.name, tagline: VILLAIN.tagline, disguises: Object.entries(DISGUISES).map(([id, label]) => ({ id, label })) },
}))
