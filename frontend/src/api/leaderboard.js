// Le classement.

import { request } from './http.js'

// GET /api/leaderboard?period=week|all
export function getLeaderboard(period = 'week') {
  return request('GET', `/leaderboard?period=${encodeURIComponent(period)}`)
}
