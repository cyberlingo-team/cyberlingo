// Les couleurs des thèmes du parcours, telles que le serveur les nomme (« toque », « bec »…),
// traduites en variables CSS : la couleur et son ombre.

export function unitStyle(color) {
  const name = color || 'toque'
  return { '--unit': `var(--unit-${name})`, '--unit-deep': `var(--unit-${name}-deep)` }
}
