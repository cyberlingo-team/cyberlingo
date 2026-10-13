// La typographie musclée : le pseudo d'un joueur s'écrit avec la police Anybody, plus grasse et
// plus large à mesure que son Tux grandit. Du Poussin (stade 0), maigre et serré mais encore
// lisible en petit, au Brise-glace (stade 7), noir et large.

export const MAX_LEVEL = 7

export function muscle(level = 0) {
  const safe = Math.max(0, Math.min(MAX_LEVEL, Number(level) || 0))
  return {
    fontWeight: Math.round(340 + safe * 80),
    fontStretch: `${Math.round(76 + safe * 8)}%`,
  }
}
