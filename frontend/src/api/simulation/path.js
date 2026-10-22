// Le chemin du parcours, tel que le serveur le déroule : pour chaque thème, ses leçons, son
// coffre et son bilan, à faire dans l'ordre. Une leçon est une mission jouée à son rythme ; le
// bilan reprend une question de chaque leçon du thème.

import { MISSIONS } from './missions/index.js'
import { UNITS, CHEST_AFTER } from './units.js'

const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission]))

export function missionById(id) {
  return MISSION_BY_ID[id] || null
}

// Tous les nœuds du chemin, dans l'ordre : { type, id, unit, index }.
//   lesson  l'identifiant est celui de la mission
//   chest   « coffre-<thème> »
//   review  « bilan-<thème> »
export const NODES = UNITS.flatMap((unit) => {
  const nodes = unit.missions.map((id) => ({ type: 'lesson', id, unit: unit.id }))
  nodes.splice(CHEST_AFTER, 0, { type: 'chest', id: `coffre-${unit.id}`, unit: unit.id })
  nodes.push({ type: 'review', id: `bilan-${unit.id}`, unit: unit.id })
  return nodes
}).map((node, index) => ({ ...node, index }))

const NODE_BY_ID = Object.fromEntries(NODES.map((node) => [node.id, node]))

export function nodeById(id) {
  return NODE_BY_ID[id] || null
}

export function unitById(id) {
  return UNITS.find((unit) => unit.id === id) || null
}

// La question du bilan pour une mission : de préférence celle où l'on cherche les indices, sinon
// la première qui montre un document à examiner.
function reviewQuestion(mission) {
  return (
    mission.questions.find((q) => q.kind === 'clues') ||
    mission.questions.find((q) => q.artifact) ||
    mission.questions[0]
  )
}

// Le contenu complet d'une leçon ou d'un bilan, réponses comprises (le serveur seul le lit).
// Chaque question garde le membre de la bande qui y figure.
export function lessonContent(id) {
  const node = nodeById(id)
  if (!node || node.type === 'chest') return null
  const unit = unitById(node.unit)
  if (node.type === 'lesson') {
    const mission = missionById(id)
    return {
      id,
      kind: 'lesson',
      unit,
      title: mission.title,
      theme: mission.theme,
      hook: mission.hook,
      guest: mission.guest,
      moral: mission.moral,
      reflexes: null,
      sources: mission.sources,
      questions: mission.questions.map((q) => ({ ...q, guest: mission.guest })),
    }
  }
  const missions = unit.missions.map(missionById)
  const sources = []
  for (const mission of missions) {
    for (const source of mission.sources || []) {
      if (sources.length < 3 && !sources.some((s) => s.url === source.url)) sources.push(source)
    }
  }
  return {
    id,
    kind: 'review',
    unit,
    title: `Bilan : ${unit.title.charAt(0).toLowerCase()}${unit.title.slice(1)}`,
    theme: unit.title,
    hook: unit.description,
    guest: null,
    // Le bilan rappelle le réflexe de chaque leçon du thème.
    moral: null,
    reflexes: missions.map((m) => ({ title: m.title, moral: m.moral })),
    sources,
    questions: missions.map((mission) => {
      const question = reviewQuestion(mission)
      return { ...question, id: `${mission.id}~${question.id}`, guest: mission.guest }
    }),
  }
}
