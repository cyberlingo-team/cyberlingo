// Quelle mission tombe quel jour. Le site a « ouvert » il y a LAUNCH_DAYS_AGO jours : les
// archives remontent jusque-là. Les missions tournent sur un cycle plus long que l'historique
// visible, si bien que la mission de demain n'apparaît jamais dans les archives.

import { MISSIONS } from './missions/index.js'
import { addDays, dayNumber, daysBetween } from './dates.js'

export const LAUNCH_DAYS_AGO = 27

export function launchDate(today) {
  return addDays(today, -LAUNCH_DAYS_AGO)
}

export function missionForDate(date) {
  return MISSIONS[dayNumber(date) % MISSIONS.length]
}

export function isPublished(date, today) {
  const age = daysBetween(date, today)
  return age >= 0 && age <= LAUNCH_DAYS_AGO
}

// Dates publiées, de la plus récente (aujourd'hui) à la plus ancienne.
export function publishedDates(today) {
  return Array.from({ length: LAUNCH_DAYS_AGO + 1 }, (_, i) => addDays(today, -i))
}
