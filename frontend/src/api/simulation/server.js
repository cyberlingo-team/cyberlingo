// Le serveur simulé. Il répond aux routes décrites dans ../CONTRAT.md exactement comme le fera
// le back-end Express : mêmes chemins, mêmes réponses, mêmes erreurs. Il vérifie les réponses
// lui-même : l'interface ne reçoit jamais la solution d'une question avant d'y avoir répondu.

import { load, save } from './store.js'
import { demoWorld, DEMO_ACCOUNTS, DEMO_PASSWORD } from './players.js'
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
} from './rules.js'
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
    }
  }
  // Un compte de démonstration renommé hier n'existe plus : sa session non plus.
  if (db.session.username && !db.accounts[db.session.username.toLowerCase()]) db.session.username = null
  db.seeded = today
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
  const points = sumPoints(results)
  const stage = stageFor(points)
  const streak = streakOf(results, ctx.today)
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
  }
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
  ctx.db.session = { username: null, guest: {} }
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
    account,
  }))
  return [...bots, ...accounts]
}

function sumPoints(results, fromDate = null) {
  let total = 0
  for (const [date, result] of Object.entries(results)) if (!fromDate || date >= fromDate) total += result.points
  return total
}

// Série en cours : elle reste vivante tant que la journée n'est pas finie.
function streakOf(results, today) {
  const dates = new Set(Object.keys(results))
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
  const lastPlayed = [...dates].sort().at(-1) || null
  return { current, best, playedToday: dates.has(today), lastPlayed }
}

// Série au soir d'une date donnée (sert au bonus de série de cette date-là).
function streakAt(results, date) {
  let streak = 0
  let cursor = date
  while (results[cursor]) {
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
      points: sumPoints(p.results, from),
      level: stageFor(sumPoints(p.results)).level,
      streak: streakOf(p.results, today).current,
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
function nextChance(ctx, results) {
  const streak = streakOf(results, ctx.today)
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
    me: mine ? { ...publicRow(mine, me), ahead: aheadOf(rows, mine), next: nextChance(ctx, resultsOf(me, ctx.today)) } : null,
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
  const streak = streakAt(previous, addDays(date, -1)) + 1
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
    result.points = missionPoints(correct, total, streakAt(results, date))
    // Le joueur avant et après l'épisode du jour : de quoi montrer son Tux grandir.
    if (date === ctx.today) {
      const after = sumPoints(results)
      const before = after - results[date].points
      const streak = streakOf(results, ctx.today)
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
        next: nextChance(ctx, results),
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
  const points = sumPoints(results)
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
    streak: streakOf(results, ctx.today),
    rank: { week: rankIn('week'), all: rankIn('all') },
    totals: {
      episodes: played.length,
      correct: played.reduce((sum, r) => sum + r.correct, 0),
      questions: played.reduce((sum, r) => sum + r.total, 0),
    },
    days,
  }
})

route('PATCH', '/me', (ctx) => {
  const account = requireAccount(ctx)
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
  if (!passwordMatches(account, ctx.body.password)) {
    throw new HttpError(403, 'wrong_password', 'Le formulaire contient des erreurs.', { password: 'Ce n’est pas ton mot de passe.' })
  }
  delete ctx.db.accounts[account.username.toLowerCase()]
  ctx.db.session = { username: null, guest: {} }
})

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
