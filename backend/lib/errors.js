// Les erreurs de l'API. Elles ont toutes la même forme (voir « Règles communes » dans
// frontend/src/api/CONTRAT.md) :
//   { "error": { "code": "invalid", "message": "Le formulaire contient des erreurs.", "fields": { … } } }
//
// Dans une route, il suffit de lever une HttpError : le gestionnaire d'erreurs en bas de app.js
// la transforme en réponse. Express 5 attrape aussi les erreurs des fonctions async.
//
//   throw new HttpError(404, 'mission_not_found', 'Aucun épisode ce jour-là.')

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export function sendError(res, status, code, message, fields) {
  res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } })
}

// À accrocher à chaque route, après ses méthodes : la route existe, mais pas avec cette méthode.
//   router.route('/session').get(…).all(methodNotAllowed)
export function methodNotAllowed(req, res) {
  sendError(res, 405, 'method_not_allowed', 'Méthode non prise en charge sur cette route.')
}

// Après toutes les routes : aucune ne correspond.
export function routeNotFound(req, res) {
  sendError(res, 404, 'route_not_found', 'Cette route n’existe pas.')
}

// Le dernier middleware d'Express : c'est ses quatre paramètres qui le font reconnaître comme
// gestionnaire d'erreurs, même si `next` ne sert pas.
export function errorHandler(error, req, res, next) {
  if (error instanceof HttpError) return sendError(res, error.status, error.code, error.message, error.fields)
  // Corps de requête qui n'est pas du JSON valide (renvoyé par express.json()).
  if (error.type === 'entity.parse.failed') return sendError(res, 400, 'invalid', 'La requête n’est pas du JSON valide.')
  // Le reste est imprévu : on le journalise côté serveur, sans rien en dire au navigateur.
  // Le corps de la requête n'est jamais journalisé (il peut contenir un mot de passe).
  console.error(`Erreur sur ${req.method} ${req.originalUrl} :`, error)
  sendError(res, 500, 'server_error', 'Le serveur a rencontré une erreur.')
}
