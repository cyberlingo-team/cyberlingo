// Hasard reproductible : les mêmes graines donnent toujours les mêmes joueurs et les mêmes
// historiques, pour que le classement ne change pas à chaque rechargement de la page.

export function createRandom(seed) {
  let state = hashSeed(seed)
  // mulberry32
  return function random() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(seed) {
  const text = String(seed)
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pick(random, list) {
  return list[Math.floor(random() * list.length)]
}

export function between(random, min, max) {
  return min + random() * (max - min)
}
