// Dans les textes des artefacts (SMS, mails, pages web…), {{zone|texte}} délimite une zone :
// on peut la toucher quand on cherche des indices, et Tux le prof l'annote après la réponse.

const ZONE = /\{\{([\w-]+)\|([^}]*)\}\}/g

// « Réglez {{somme|1,99 €}} vite » → [{ text: 'Réglez ' }, { zone: 'somme', text: '1,99 €' }, …]
export function parseZones(text) {
  const source = String(text ?? '')
  const parts = []
  let last = 0
  for (const match of source.matchAll(ZONE)) {
    if (match.index > last) parts.push({ text: source.slice(last, match.index) })
    parts.push({ zone: match[1], text: match[2] })
    last = match.index + match[0].length
  }
  if (last < source.length) parts.push({ text: source.slice(last) })
  return parts
}

// Le texte sans ses marques de zones.
export function stripZones(text) {
  return String(text ?? '').replace(ZONE, '$2')
}

// Toutes les zones d'un artefact, dans l'ordre où elles apparaissent.
export function zonesOf(value, found = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(ZONE)) if (!found.includes(match[1])) found.push(match[1])
  } else if (Array.isArray(value)) {
    value.forEach((item) => zonesOf(item, found))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => zonesOf(item, found))
  }
  return found
}

// Le texte affiché d'une zone, pour la nommer dans une annotation.
export function zoneText(artifact, zone) {
  let found = null
  const visit = (value) => {
    if (found) return
    if (typeof value === 'string') {
      for (const match of value.matchAll(ZONE)) if (match[1] === zone) found = match[2]
    } else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  visit(artifact)
  return found
}
