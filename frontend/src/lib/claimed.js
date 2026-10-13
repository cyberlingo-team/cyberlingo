// Ce que devient l'épisode joué sans compte, une fois le compte créé ou la connexion faite.

import { plural } from './format.js'

export function claimedMessage(claimed) {
  if (!claimed) return ''
  if (claimed.completed) {
    return `L’épisode du jour est maintenant à ton nom : ${plural(claimed.points, 'point')} pour ton Tux.`
  }
  return `Tes ${plural(claimed.answered, 'réponse')} du jour sont gardées. Finis l’épisode pour marquer tes points.`
}
