// Les règles du jeu, telles que le serveur les appliquera : stades du Tux et barème des points.

export const STAGES = [
  { level: 0, name: 'Poussin', minPoints: 0, motto: 'Il vient d’éclore. Il clique encore sur tout.' },
  { level: 1, name: 'Prof', minPoints: 60, motto: 'Il a mis sa toque. Il commence à se méfier.' },
  { level: 2, name: 'Échauffé', minPoints: 200, motto: 'Bandeau sur le front, il ne répond plus aux SMS louches.' },
  { level: 3, name: 'Sportif', minPoints: 420, motto: 'Gourde à la main, il lit l’adresse avant de cliquer.' },
  { level: 4, name: 'Costaud', minPoints: 700, motto: 'Les faux conseillers raccrochent avant lui.' },
  { level: 5, name: 'Balèze', minPoints: 1050, motto: 'Ses mots de passe sont plus solides que ses biceps.' },
  { level: 6, name: 'Armoire à glace', minPoints: 1450, motto: 'Léopold change de trottoir quand il le croise.' },
  { level: 7, name: 'Brise-glace', minPoints: 1900, motto: 'Il a tordu sa baguette. Les arnaques aussi.' },
]

export const POINTS_PER_CORRECT_ANSWER = 10
export const PERFECT_BONUS = 10
export const STREAK_BONUS_PER_DAY = 2
export const STREAK_BONUS_MAX_DAYS = 10

export function stageFor(points) {
  let current = STAGES[0]
  for (const stage of STAGES) if (points >= stage.minPoints) current = stage
  const next = STAGES[current.level + 1] || null
  return {
    level: current.level,
    name: current.name,
    minPoints: current.minPoints,
    next: next ? { level: next.level, name: next.name, minPoints: next.minPoints } : null,
  }
}

// Points d'une mission terminée. `streak` est la série en comptant la mission du jour.
export function missionPoints(correctCount, questionCount, streak) {
  const answers = correctCount * POINTS_PER_CORRECT_ANSWER
  const perfect = correctCount === questionCount ? PERFECT_BONUS : 0
  const streakBonus = Math.min(streak, STREAK_BONUS_MAX_DAYS) * STREAK_BONUS_PER_DAY
  return { answers, perfect, streak: streakBonus, total: answers + perfect + streakBonus }
}
