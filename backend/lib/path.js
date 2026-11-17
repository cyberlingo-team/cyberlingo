// Où en est un joueur sur le chemin : étapes faites, étape en cours, étapes verrouillées.
// Une étape est faite quand la leçon (ou le bilan) a été terminée, ou le coffre ouvert.

import prisma from '../prisma.js'
import { NODES } from './content.js'

export async function doneIdsOf(playerId) {
  const [runs, chests] = await Promise.all([
    prisma.lessonRun.findMany({ where: { playerId, completedOn: { not: null } }, select: { lessonId: true } }),
    prisma.chestOpening.findMany({ where: { playerId }, select: { chestId: true } }),
  ])
  return new Set([...runs.map((run) => run.lessonId), ...chests.map((chest) => chest.chestId)])
}

// La première étape pas encore franchie : tout ce qui la précède est fait, tout ce qui la suit
// est verrouillé. null quand tout le chemin est fait.
export function currentNode(done) {
  return NODES.find((node) => !done.has(node.id)) || null
}

// 'done', 'current' ou 'locked'.
export function nodeStatus(node, done) {
  if (done.has(node.id)) return 'done'
  return currentNode(done)?.id === node.id ? 'current' : 'locked'
}
