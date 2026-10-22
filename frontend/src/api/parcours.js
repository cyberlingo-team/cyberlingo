// Le parcours : le chemin des thèmes, les leçons, les coffres et le guide de chaque thème.

import { request } from './http.js'

// GET /api/path
export function getPath() {
  return request('GET', '/path')
}

// GET /api/units/:id/guide
export function getUnitGuide(unitId) {
  return request('GET', `/units/${encodeURIComponent(unitId)}/guide`)
}

// POST /api/lessons/:id/start
export function startLesson(lessonId) {
  return request('POST', `/lessons/${encodeURIComponent(lessonId)}/start`)
}

// POST /api/lessons/:id/answers
export function sendLessonAnswer(lessonId, questionId, answer) {
  return request('POST', `/lessons/${encodeURIComponent(lessonId)}/answers`, { questionId, answer })
}

// GET /api/lessons/:id/result
export function getLessonResult(lessonId) {
  return request('GET', `/lessons/${encodeURIComponent(lessonId)}/result`)
}

// POST /api/path/chests/:id
export function openChest(chestId) {
  return request('POST', `/path/chests/${encodeURIComponent(chestId)}`)
}
