// L'application Express : les middlewares, puis les routes de l'API, puis les erreurs.
// server.js la fait écouter sur un port ; les tests (test/) la lancent eux-mêmes.
//
// Pour ajouter des routes : écrire un fichier dans routes/ sur le modèle de routes/game.js
// (un Router, une route par chemin, `.all(methodNotAllowed)` en dernier), puis l'accrocher
// ci-dessous avec `api.use(...)`. Le contrat de chaque route est dans frontend/src/api/CONTRAT.md.

import express from 'express'
import cookieParser from 'cookie-parser'
import { readSession } from './lib/session.js'
import { errorHandler, routeNotFound } from './lib/errors.js'
import authRoutes from './routes/auth.js'
import gameRoutes from './routes/game.js'
import missionRoutes from './routes/missions.js'

const app = express()

// Derrière le proxy de Vite (ou un hébergeur), l'adresse du visiteur arrive dans X-Forwarded-For.
app.set('trust proxy', 'loopback')
// Pas d'en-tête « X-Powered-By: Express » : inutile d'annoncer la technologie aux curieux.
app.disable('x-powered-by')

const api = express.Router()
api.use(express.json({ limit: '20kb' }))
api.use(cookieParser())
api.use(readSession)
// Les réponses de l'API dépendent du joueur et du jour : jamais de cache.
api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

api.use(authRoutes)
api.use(gameRoutes)
api.use(missionRoutes)

api.use(routeNotFound)
app.use('/api', api)
app.use(routeNotFound)
app.use(errorHandler)

export default app
