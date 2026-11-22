// Vérifier la réponse d'un joueur à une question, et montrer la question sans sa solution.
// Sert aux leçons du chemin (routes/lessons.js) et aux épisodes de la mission du jour.

import { HttpError } from './errors.js'
import { GANG } from './content.js'

// Les zones touchables d'un objet : `{{zone|texte}}` dans ses textes (questions `clues`).
export function zonesOf(value, found = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\{\{(\w[\w-]*)\|/g)) if (!found.includes(match[1])) found.push(match[1])
  } else if (Array.isArray(value)) {
    value.forEach((item) => zonesOf(item, found))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => zonesOf(item, found))
  }
  return found
}

// La réponse est-elle juste ? Lève 400 `invalid_answer` si elle n'a pas la forme attendue pour ce
// type de question. `null` : le joueur passe la question, elle compte comme une erreur.
export function checkAnswer(question, answer) {
  const invalid = () => new HttpError(400, 'invalid_answer', 'Cette réponse ne correspond pas à la question.')
  if (answer === null) return false
  switch (question.kind) {
    case 'trap':
      if (answer !== 'trap' && answer !== 'safe') throw invalid()
      return answer === question.answer
    case 'truefalse':
      if (typeof answer !== 'boolean') throw invalid()
      return answer === question.answer
    case 'choice':
      if (!question.options.some((option) => option.id === answer)) throw invalid()
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

// La question telle que le joueur la voit : sans la réponse attendue.
export function publicQuestion(question) {
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

// Une réponse corrigée (`Revealed` dans CONTRAT.md). `success` : part des joueurs, en pour cent,
// qui ont répondu juste.
export function revealed(question, entry, success) {
  return {
    answer: entry.answer,
    correct: entry.correct,
    solution: question.answer,
    explanation: question.explanation,
    notes: question.notes || [],
    success,
  }
}

// Un membre de la bande, tel que l'interface l'affiche.
export function guestCard(id) {
  const guest = GANG[id]
  return guest ? { id: guest.id, name: guest.name, tagline: guest.tagline, look: guest.look } : null
}
