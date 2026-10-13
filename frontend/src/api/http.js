// Toutes les requêtes de l'interface passent par ici. Tant que le back-end Express n'existe
// pas, elles partent vers le serveur simulé (dossier simulation/). Le jour où il existe,
// passer USE_SIMULATION à false suffit : chemins, réponses et erreurs sont les mêmes
// (voir CONTRAT.md).
//
// La session est un cookie httpOnly posé par le serveur : l'interface ne voit jamais de jeton.
// Pour savoir qui est connecté, elle le demande (GET /api/session).

import { typo } from '../lib/format.js'

export const USE_SIMULATION = true

export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  // Vrai quand le serveur est injoignable ou en panne, et qu'il faut proposer de réessayer.
  get unreachable() {
    return this.status === 0 || this.status >= 500
  }
}

async function send(method, path, body) {
  if (USE_SIMULATION) {
    const { simulate } = await import('./simulation/index.js')
    return simulate(method, `/api${path}`, body)
  }
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  return { status: response.status, body: data }
}

export async function request(method, path, body) {
  let response
  try {
    response = await send(method, path, body)
  } catch {
    response = { status: 0, body: null }
  }
  const { status, body: data } = response
  if (status >= 200 && status < 300) return data
  if (status === 0) throw new ApiError(0, 'network', 'Le serveur ne répond pas.')
  // Les messages du serveur arrivent en texte brut : on y pose les espaces insécables du
  // français, pour qu'une ligne ne commence jamais par un deux-points.
  const error = data?.error
  const fields = Object.fromEntries(Object.entries(error?.fields || {}).map(([name, text]) => [name, typo(text)]))
  throw new ApiError(status, error?.code || 'unknown', typo(error?.message || 'Le serveur a renvoyé une erreur.'), fields)
}
