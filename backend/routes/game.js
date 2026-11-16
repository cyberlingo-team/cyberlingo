// Les règles du jeu et les personnages : voir « Les règles du jeu et les personnages » dans
// frontend/src/api/CONTRAT.md.
//
//   GET /api/game   stades du Tux et barème des points
//   GET /api/cast   la bande à Tux et Léopold

import { Router } from 'express'
import { methodNotAllowed } from '../lib/errors.js'
import {
  STAGES,
  POINTS_PER_CORRECT_ANSWER,
  PERFECT_BONUS,
  STREAK_BONUS_PER_DAY,
  STREAK_BONUS_MAX_DAYS,
  GANG,
  VILLAIN,
  DISGUISES,
} from '../lib/content.js'

const router = Router()

router
  .route('/game')
  .get((req, res) => {
    res.json({
      stages: STAGES,
      scoring: {
        correctAnswer: POINTS_PER_CORRECT_ANSWER,
        perfectBonus: PERFECT_BONUS,
        streakBonusPerDay: STREAK_BONUS_PER_DAY,
        streakBonusMaxDays: STREAK_BONUS_MAX_DAYS,
      },
    })
  })
  .all(methodNotAllowed)

router
  .route('/cast')
  .get((req, res) => {
    res.json({
      gang: Object.values(GANG),
      villain: {
        name: VILLAIN.name,
        tagline: VILLAIN.tagline,
        disguises: Object.entries(DISGUISES).map(([id, label]) => ({ id, label })),
      },
    })
  })
  .all(methodNotAllowed)

export default router
