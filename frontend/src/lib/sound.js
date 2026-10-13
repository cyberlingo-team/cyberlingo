// Les bruitages, fabriqués à la volée par le navigateur (Web Audio) : aucun fichier son.
// Ils restent muets tant que le joueur ne les a pas activés dans le pied de page.

import { preferences } from './preferences.js'

let context = null

function audio() {
  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    context = new AudioContext()
  }
  if (context.state === 'suspended') context.resume()
  return context
}

function note(ctx, { frequency, to, start = 0, duration = 0.14, type = 'triangle', volume = 0.18 }) {
  const t = ctx.currentTime + start
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, t)
  if (to) oscillator.frequency.exponentialRampToValueAtTime(to, t + duration)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(t)
  oscillator.stop(t + duration + 0.02)
}

// Le « pof » sourd d'un tampon encreur.
function thump(ctx) {
  const length = Math.floor(ctx.sampleRate * 0.12)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  filter.type = 'lowpass'
  filter.frequency.value = 700
  gain.gain.value = 0.5
  source.buffer = buffer
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start()
  note(ctx, { frequency: 110, to: 60, duration: 0.12, type: 'sine', volume: 0.35 })
}

const SOUNDS = {
  stamp: thump,
  correct(ctx) {
    note(ctx, { frequency: 659, duration: 0.11 })
    note(ctx, { frequency: 988, start: 0.09, duration: 0.2 })
  },
  wrong(ctx) {
    note(ctx, { frequency: 330, to: 196, duration: 0.32, type: 'sawtooth', volume: 0.07 })
  },
  grow(ctx) {
    ;[523, 659, 784, 1047].forEach((frequency, i) => note(ctx, { frequency, start: i * 0.09, duration: 0.18 }))
  },
  unmask(ctx) {
    note(ctx, { frequency: 400, to: 1200, duration: 0.35, type: 'sine', volume: 0.12 })
    note(ctx, { frequency: 1200, to: 300, start: 0.35, duration: 0.3, type: 'sine', volume: 0.1 })
  },
}

export function playSound(name) {
  if (!preferences.sound) return
  try {
    const ctx = audio()
    if (ctx) SOUNDS[name]?.(ctx)
  } catch {
    // Pas de son possible ici : on continue en silence.
  }
}
