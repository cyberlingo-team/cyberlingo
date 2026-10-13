// Préférences de confort, gardées dans ce navigateur : les bruitages (coupés au départ) et les
// animations (réduites d'office si le système le demande).

import { reactive, watch } from 'vue'

const KEY = 'cyberlingo.preferences'

function systemPrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const stored = readStored()

export const preferences = reactive({
  sound: stored.sound === true,
  motion: stored.motion === 'full' || stored.motion === 'reduced' ? stored.motion : systemPrefersReducedMotion() ? 'reduced' : 'full',
})

export function reducedMotion() {
  return preferences.motion === 'reduced'
}

export function applyPreferences() {
  document.documentElement.dataset.motion = preferences.motion
}

watch(preferences, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ sound: preferences.sound, motion: preferences.motion }))
  } catch {
    // Stockage indisponible (navigation privée stricte) : la préférence vaut pour la visite.
  }
  applyPreferences()
})
