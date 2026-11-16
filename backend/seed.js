// Remplit la base avec de quoi tourner la vidéo : les épisodes, un calendrier qui a « ouvert »
// il y a 27 jours, environ 200 joueurs avec leur passé, et les trois comptes de démonstration.
//
//   npm run seed
//
// Le monde est recalculé à partir de la date du jour, exactement comme dans le serveur simulé
// de l'interface (frontend/src/api/simulation/players.js) : relancer le seed le matin du
// tournage donne un classement et des séries à jour. Il efface d'abord toute la base, comptes
// créés à la main compris.

import 'dotenv/config'
import prisma from './prisma.js'
import { hashPassword, usernameKey } from './lib/accounts.js'
import { today as parisToday, addDays, daysBetween, toDbDate, fromDbDate } from './lib/dates.js'
import { MAX_BUOYS, NODES } from './lib/content.js'
import { MISSIONS } from '../frontend/src/api/simulation/missions/index.js'
import { LAUNCH_DAYS_AGO, missionForDate } from '../frontend/src/api/simulation/calendar.js'
import { demoWorld, demoPath, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../frontend/src/api/simulation/players.js'

// Les épisodes sont programmés jusque-là : au-delà, relancer le seed.
const DAYS_AHEAD = 120

const today = parisToday()
const launch = addDays(today, -LAUNCH_DAYS_AGO)

// Les zones qu'on peut toucher dans un objet : `{{zone|texte}}`.
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

// Une mauvaise réponse plausible, pour les parties simulées des joueurs.
function wrongAnswer(question) {
  switch (question.kind) {
    case 'trap':
      return question.answer === 'trap' ? 'safe' : 'trap'
    case 'truefalse':
      return !question.answer
    case 'choice':
      return question.options.find((option) => option.id !== question.answer).id
    case 'clues': {
      const decoy = zonesOf(question.artifact).find((zone) => !question.answer.includes(zone))
      return [...question.answer.slice(0, question.pick - 1), decoy]
    }
  }
  return null
}

// Les parties d'un joueur simulé : une par jour joué, chacune avec ses réponses.
function attemptsOf(player) {
  return Object.entries(player.results).map(([date, result]) => {
    const mission = missionForDate(date)
    return {
      date,
      points: result.points,
      answers: mission.questions.map((question, i) => ({
        questionId: question.id,
        value: result.flags[i] ? question.answer : wrongAnswer(question),
        correct: result.flags[i],
      })),
    }
  })
}

// Le chemin d'un compte de démonstration : leçons faites, coffres ouverts, réserve.
function pathOf(demo) {
  const { history, chests } = demoPath(demo, today)
  const lessonRuns = history.map((entry) => ({
    lessonId: entry.id,
    firstTime: true,
    correct: entry.correct,
    points: entry.points,
    sardines: null,
    startedAt: new Date(`${entry.date}T17:00:00.000Z`),
    completedOn: toDbDate(entry.date),
  }))
  // Un coffre s'ouvre le jour où l'on a fini la leçon qui le précède.
  const chestOpenings = chests.map((chestId) => {
    const index = NODES.findIndex((node) => node.id === chestId)
    const before = [...NODES.slice(0, index)].reverse().find((node) => node.type !== 'chest')
    const entry = history.find((h) => h.id === before?.id)
    return { chestId, openedOn: toDbDate(entry?.date ?? today) }
  })
  return { lessonRuns, chestOpenings }
}

async function main() {
  console.log(`Seed du ${today} : lancement du site le ${launch}.`)

  // Tout effacer, dans l'ordre des dépendances (les réponses partent avec les parties).
  await prisma.loginFailure.deleteMany()
  await prisma.player.deleteMany()
  await prisma.episode.deleteMany()
  await prisma.mission.deleteMany()

  await prisma.mission.createMany({
    data: MISSIONS.map((mission) => ({
      id: mission.id,
      title: mission.title,
      theme: mission.theme,
      hook: mission.hook,
      guest: mission.guest,
      villain: mission.villain ?? null,
      moral: mission.moral,
      sources: mission.sources ?? [],
      questions: mission.questions,
    })),
  })
  console.log(`${MISSIONS.length} missions.`)

  const episodes = []
  for (let date = launch; daysBetween(date, today) >= -DAYS_AHEAD; date = addDays(date, 1)) {
    episodes.push({ date: toDbDate(date), number: daysBetween(launch, date) + 1, missionId: missionForDate(date).id })
  }
  await prisma.episode.createMany({ data: episodes })
  console.log(`${episodes.length} épisodes, du ${launch} au ${addDays(today, DAYS_AHEAD)}.`)

  const demoHash = await hashPassword(DEMO_PASSWORD)
  const demos = Object.fromEntries(DEMO_ACCOUNTS.map((demo) => [demo.username, demo]))
  let answers = 0
  for (const player of demoWorld(today)) {
    const demo = demos[player.username]
    const path = demo ? pathOf(demo) : { lessonRuns: [], chestOpenings: [] }
    const created = await prisma.player.create({
      data: {
        username: player.username,
        usernameKey: usernameKey(player.username),
        // Les joueurs simulés n'ont pas de mot de passe : personne ne peut se connecter à leur
        // place. Seuls les comptes de démonstration en ont un.
        passwordHash: demo ? demoHash : null,
        createdOn: toDbDate(player.createdAt),
        sardines: demo?.sardines ?? 100,
        buoys: MAX_BUOYS,
        buoysRefilledOn: toDbDate(today),
        freezes: demo?.freezes ?? 0,
        lessonRuns: { create: path.lessonRuns },
        chests: { create: path.chestOpenings },
      },
    })

    // Les parties et leurs réponses, en deux requêtes groupées plutôt qu'une par ligne.
    const attempts = attemptsOf(player)
    const stored = await prisma.attempt.createManyAndReturn({
      data: attempts.map((attempt) => ({
        playerId: created.id,
        date: toDbDate(attempt.date),
        mode: 'counted',
        points: attempt.points,
        // Le soir du jour joué, pour que l'ordre des parties reste vraisemblable.
        completedAt: new Date(`${attempt.date}T18:00:00.000Z`),
      })),
      select: { id: true, date: true },
    })
    const idByDate = Object.fromEntries(stored.map((row) => [fromDbDate(row.date), row.id]))
    const rows = attempts.flatMap((attempt) => attempt.answers.map((answer) => ({ ...answer, attemptId: idByDate[attempt.date] })))
    await prisma.answer.createMany({ data: rows })
    answers += rows.length
  }
  console.log(`${demoWorld(today).length} joueurs, ${answers} réponses.`)
  console.log(`Comptes de démonstration (mot de passe « ${DEMO_PASSWORD} ») : ${DEMO_ACCOUNTS.map((d) => d.username).join(', ')}.`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
