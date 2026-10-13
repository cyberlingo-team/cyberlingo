// Les épisodes : celui du jour, les archives, les réponses et la fin de l'épisode.

import { request } from './http.js'

// GET /api/missions/today
export function getTodayMission() {
  return request('GET', '/missions/today')
}

// GET /api/missions
export function listMissions() {
  return request('GET', '/missions')
}

// GET /api/missions/:date
export function getMission(date) {
  return request('GET', `/missions/${encodeURIComponent(date)}`)
}

// POST /api/missions/:date/answers
export function sendAnswer(date, questionId, answer) {
  return request('POST', `/missions/${encodeURIComponent(date)}/answers`, { questionId, answer })
}

// GET /api/missions/:date/result
export function getResult(date) {
  return request('GET', `/missions/${encodeURIComponent(date)}/result`)
}
