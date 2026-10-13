// Les joueurs de démonstration et leur passé, recalculés à chaque chargement à partir de la
// date du jour : le classement a toujours un haut, un milieu et un bas, quel que soit le jour
// où l'on tourne la vidéo.

import { createRandom, between } from './random.js'
import { addDays } from './dates.js'
import { missionPoints } from './rules.js'
import { USERNAMES, LONGEST_USERNAME } from './usernames.js'
import { LAUNCH_DAYS_AGO, missionForDate } from './calendar.js'

// Mot de passe commun aux comptes de démonstration (il est aussi écrit dans CONTRAT.md).
export const DEMO_PASSWORD = 'banquise-sardine-parapluie'

// Comptes de démonstration dans lesquels on peut se connecter. Chacun montre un état de
// l'interface.
export const DEMO_ACCOUNTS = [
  // L'habitué : une série en cours, la mission du jour pas encore faite. Il arrive juste sous
  // le stade Balèze (1 050 points) : l'épisode du jour, même raté, fait grandir son Tux.
  { username: 'sacha_31', joinedDaysAgo: 24, skill: 0.74, missedDaysAgo: [21, 17, 12], playsToday: false, targetPoints: 1039 },
  // La série perdue : neuf jours d'affilée, puis plus rien hier.
  { username: 'malo.dlt', joinedDaysAgo: 19, skill: 0.68, missedDaysAgo: [18, 16, 15, 13, 12, 11, 1], playsToday: false },
  // Le colosse au pseudo de trente caractères, qui a déjà fait la mission du jour.
  { username: LONGEST_USERNAME, joinedDaysAgo: LAUNCH_DAYS_AGO, skill: 0.97, missedDaysAgo: [], playsToday: true },
]

// Une partie simulée : pour chaque question, juste (true) ou faux (false).
function playMission(random, date, skill) {
  const mission = missionForDate(date)
  const flags = mission.questions.map((question) => {
    // Une question réussie par 50 % des joueurs est plus dure qu'une réussie par 80 %.
    const chance = Math.min(0.99, skill * (0.55 + question.success * 0.6))
    return random() < chance
  })
  return { flags, correct: flags.filter(Boolean).length, total: flags.length }
}

// Calcule les points jour après jour, avec la série du moment.
function scoreHistory(days) {
  const results = {}
  let streak = 0
  let previous = null
  for (const day of days) {
    streak = previous && addDays(previous, 1) === day.date ? streak + 1 : 1
    previous = day.date
    results[day.date] = {
      flags: day.flags,
      correct: day.correct,
      total: day.total,
      points: missionPoints(day.correct, day.total, streak).total,
    }
  }
  return results
}

const totalPoints = (days) => Object.values(scoreHistory(days)).reduce((total, result) => total + result.points, 0)

// Les missions changent avec la date, donc les points d'un compte aussi. Pour qu'il arrive au
// jour J avec à peine moins de `target` points, on bascule quelques réponses anciennes, une
// par jour et par passage, sans jamais créer de sans-faute (qui rapporterait 20 points d'un coup).
function calibrate(days, target) {
  // La question basculée change d'un jour à l'autre, pour ne pas toujours viser la première.
  const pickFlag = (day, value, turn) => {
    const indexes = day.flags.flatMap((flag, i) => (flag === value ? [i] : []))
    return indexes.length ? indexes[turn % indexes.length] : -1
  }
  let total = totalPoints(days)
  for (let pass = 0; pass < 5 && total - target > 0; pass++) {
    days.forEach((day, d) => {
      const i = pickFlag(day, true, pass + d)
      if (total - target <= 0 || i < 0) return
      day.flags[i] = false
      day.correct--
      total = totalPoints(days)
    })
  }
  for (let pass = 0; pass < 5 && target - total >= 10; pass++) {
    days.forEach((day, d) => {
      const i = pickFlag(day, false, pass + d)
      if (target - total < 10 || i < 0 || day.correct >= day.total - 1) return
      day.flags[i] = true
      day.correct++
      total = totalPoints(days)
    })
  }
}

function demoPlayer(account, today) {
  const random = createRandom(`demo:${account.username}`)
  const days = []
  for (let ago = account.joinedDaysAgo; ago >= 0; ago--) {
    if (account.missedDaysAgo.includes(ago)) continue
    if (ago === 0 && !account.playsToday) continue
    const date = addDays(today, -ago)
    days.push({ date, ...playMission(random, date, account.skill) })
  }
  if (account.targetPoints) calibrate(days, account.targetPoints)
  return {
    username: account.username,
    createdAt: addDays(today, -account.joinedDaysAgo),
    results: scoreHistory(days),
    demo: true,
  }
}

function botPlayer(username, today) {
  const random = createRandom(`bot:${username}`)
  // Un tiers des joueurs est là depuis l'ouverture ; quelques-uns arrivent tout juste.
  const roll = random()
  const joinedDaysAgo =
    roll < 0.34 ? LAUNCH_DAYS_AGO : roll < 0.9 ? Math.floor(between(random, 2, LAUNCH_DAYS_AGO)) : Math.floor(between(random, 0, 2))
  const style = random()
  const regularity = style < 0.25 ? between(random, 0.85, 0.98) : style < 0.6 ? between(random, 0.6, 0.85) : between(random, 0.25, 0.6)
  const skill = between(random, 0.5, 0.95)
  // Certains décrochent : ils ne jouent plus depuis quelques jours.
  const quitsDaysAgo = random() < 0.2 ? Math.floor(between(random, 1, joinedDaysAgo + 1)) : -1
  const playsToday = random() < regularity * 0.75

  const days = []
  let playedYesterday = false
  for (let ago = joinedDaysAgo; ago >= 0; ago--) {
    if (ago < quitsDaysAgo) break
    const date = addDays(today, -ago)
    // On revient plus volontiers quand on a joué la veille.
    const chance = ago === 0 ? (playsToday ? 1 : 0) : Math.min(0.99, regularity * (playedYesterday ? 1.08 : 0.85))
    playedYesterday = random() < chance
    if (playedYesterday) days.push({ date, ...playMission(random, date, skill) })
  }
  return { username, createdAt: addDays(today, -joinedDaysAgo), results: scoreHistory(days), demo: false }
}

const cache = new Map()

// Tous les joueurs simulés du jour : d'abord les comptes de démonstration, puis les autres.
export function demoWorld(today) {
  if (!cache.has(today)) {
    const players = [
      ...DEMO_ACCOUNTS.map((account) => demoPlayer(account, today)),
      ...USERNAMES.map((username) => botPlayer(username, today)),
    ]
    cache.clear()
    cache.set(today, players)
  }
  return cache.get(today)
}
