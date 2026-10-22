// Ce que devient la mission du jour jouée sans compte, une fois le compte créé ou la connexion
// faite. (Les leçons du chemin, elles, suivent toutes seules.)

import { plural } from './format.js'

export function claimedMessage(claimed) {
  if (!claimed) return ''
  if (claimed.completed) {
    return `La mission du jour est maintenant à ton nom : ${plural(claimed.points, 'point')} pour ton Tux.`
  }
  return `Tes ${plural(claimed.answered, 'réponse')} du jour sont gardées. Finis la mission du jour pour marquer tes points.`
}
