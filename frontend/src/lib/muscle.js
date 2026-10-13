// La typographie musclée : le pseudo d'un joueur s'écrit avec la police Anybody, plus grasse et
// plus large à mesure que son Tux grandit. Du Poussin (stade 0), maigre et serré, au
// Brise-glace (stade 7), noir et large.

export const MAX_LEVEL = 7

export function muscle(level = 0) {
  const safe = Math.max(0, Math.min(MAX_LEVEL, Number(level) || 0))
  return {
    fontWeight: 200 + safe * 100,
    fontStretch: `${62 + safe * 10}%`,
  }
}
