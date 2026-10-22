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

// Les leçons du parcours, à son rythme : elles rapportent moins que la mission du jour, et
// seulement la première fois. Le bilan d'un thème rapporte un peu plus.
export const LESSON_POINTS_PER_CORRECT_ANSWER = 5
export const LESSON_PERFECT_BONUS = 5
export const REVIEW_BONUS = 10

export function lessonPoints(correctCount, questionCount, { review = false } = {}) {
  const answers = correctCount * LESSON_POINTS_PER_CORRECT_ANSWER
  const perfect = correctCount === questionCount ? LESSON_PERFECT_BONUS : 0
  const bonus = review ? REVIEW_BONUS : 0
  return { answers, perfect, review: bonus, total: answers + perfect + bonus }
}

// L'économie de la banquise : les sardines (la monnaie), les bouées (les vies) et les glaçons
// (qui gèlent la série un jour où l'on n'a pas joué).
export const STARTING_SARDINES = 100
export const MAX_BUOYS = 5
export const MAX_FREEZES = 2
export const SARDINES = { lesson: 5, perfect: 5, review: 20, chest: 20 }
export const SHOP = {
  bouees: { price: 150 },
  glacon: { price: 200 },
}
