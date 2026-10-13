// Les images du site, retrouvées par identifiant. Vite les copie au moment du build et nous
// donne leur adresse finale. Les dimensions servent à réserver la place avant le chargement.

const files = import.meta.glob('../assets/**/*.webp', { eager: true, import: 'default' })

const byPath = {}
for (const [path, url] of Object.entries(files)) {
  byPath[path.replace('../assets/', '').replace('.webp', '')] = url
}

// Largeur et hauteur réelles de chaque image (en pixels).
const SIZES = {
  'tux/gang/ball-and-chain': [425, 408],
  'tux/gang/classic': [546, 640],
  'tux/gang/flat': [545, 640],
  'tux/gang/floppy': [257, 306],
  'tux/gang/gaucho': [158, 199],
  'tux/gang/hard-hat': [249, 324],
  'tux/gang/panic': [500, 497],
  'tux/gang/pipe': [546, 640],
  'tux/gang/remote': [331, 393],
  'tux/gang/server-rack': [379, 217],
  'tux/gang/styrian-hat': [506, 640],
  'tux/gang/tinfoil-hat': [208, 335],
  'tux/scenes/egg': [745, 900],
  'tux/scenes/prof-facepalm': [715, 900],
  'tux/scenes/prof-lost': [590, 900],
  'tux/scenes/prof-magnifier': [611, 900],
  'tux/scenes/prof-reading': [839, 900],
  'tux/scenes/prof-unplugged': [900, 866],
  'tux/stages/stage-0': [655, 900],
  'tux/stages/stage-1': [900, 847],
  'tux/stages/stage-2': [863, 900],
  'tux/stages/stage-3': [692, 900],
  'tux/stages/stage-4': [877, 900],
  'tux/stages/stage-5': [839, 900],
  'tux/stages/stage-6': [864, 900],
  'tux/stages/stage-7': [900, 890],
  'tux/stages/stage-0-mini': [146, 200],
  'tux/stages/stage-1-mini': [200, 188],
  'tux/stages/stage-2-mini': [192, 200],
  'tux/stages/stage-3-mini': [154, 200],
  'tux/stages/stage-4-mini': [195, 200],
  'tux/stages/stage-5-mini': [186, 200],
  'tux/stages/stage-6-mini': [192, 200],
  'tux/stages/stage-7-mini': [200, 198],
  'villain/leopold': [385, 900],
  'villain/unmasked': [456, 900],
  'villain/banker': [420, 900],
  'villain/boss': [530, 900],
  'villain/charmer': [542, 900],
  'villain/courier': [486, 900],
  'villain/fisher': [571, 900],
  'villain/official': [488, 900],
  'villain/relative': [356, 900],
  'villain/seller': [524, 900],
  'villain/sticker': [525, 900],
  'villain/techie': [469, 900],
  'villain/waiter': [595, 900],
}

function image(key) {
  const [width, height] = SIZES[key] || [1, 1]
  return { src: byPath[key], width, height }
}

// Le Tux du joueur, du Poussin (0) au Brise-glace (7). La version « mini » sert dans les listes.
export function stageImage(level, { mini = false } = {}) {
  const safe = Math.max(0, Math.min(7, Number(level) || 0))
  return image(`tux/stages/stage-${safe}${mini ? '-mini' : ''}`)
}

// Un membre de la bande à Tux (voir GET /api/cast).
export function gangImage(id) {
  return image(`tux/gang/${id}`)
}

// Tux le professeur en situation : loupe, main sur le front, débranché, perdu, en lecture ;
// et l'œuf du joueur qui n'a pas encore de compte.
export function sceneImage(name) {
  return image(`tux/scenes/${name}`)
}

// Léopold, l'escroc : sans déguisement (« leopold »), démasqué (« unmasked ») ou déguisé.
export function villainImage(id) {
  return image(`villain/${id}`)
}
