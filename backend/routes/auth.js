// Comptes et session : voir « Comptes et session » dans frontend/src/api/CONTRAT.md.
//
//   GET  /api/session       qui est connecté ?
//   GET  /api/auth/rules    règles du pseudo et du mot de passe
//   POST /api/auth/signup   crée un compte et ouvre la session
//   POST /api/auth/login    ouvre la session
//   POST /api/auth/logout   ferme la session

import { Router } from 'express'
import prisma from '../prisma.js'
import { HttpError, methodNotAllowed } from '../lib/errors.js'
import { today, toDbDate } from '../lib/dates.js'
import { openSession, closeSession, guestOf, forgetGuest } from '../lib/session.js'
import { sessionUser, claimGuest } from '../lib/players.js'
import {
  ACCOUNT_RULES,
  DAY_MS,
  hashPassword,
  passwordMatches,
  usernameProblem,
  passwordProblem,
  usernameKey,
  lockedFor,
  formatDelay,
} from '../lib/accounts.js'

const router = Router()

const TAKEN = 'Ce pseudo est déjà pris. Ajoute une touche perso : un chiffre, un point…'

function readCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  return { username, password }
}

// Erreur Prisma « valeur déjà prise » sur une colonne @unique (deux inscriptions simultanées).
const isUniqueViolation = (error) => error?.code === 'P2002'

router
  .route('/session')
  .get(async (req, res) => {
    res.json({ user: req.account ? await sessionUser(req.account, today()) : null })
  })
  .all(methodNotAllowed)

router
  .route('/auth/rules')
  .get((req, res) => {
    res.json({ username: ACCOUNT_RULES.username, password: ACCOUNT_RULES.password })
  })
  .all(methodNotAllowed)

router
  .route('/auth/signup')
  .post(async (req, res) => {
    const { username, password } = readCredentials(req.body)
    const fields = {}
    const usernameIssue = usernameProblem(username)
    if (usernameIssue) fields.username = usernameIssue
    else if (await prisma.player.findUnique({ where: { usernameKey: usernameKey(username) } })) fields.username = TAKEN
    const passwordIssue = passwordProblem(password, username)
    if (passwordIssue) fields.password = passwordIssue
    if (Object.keys(fields).length) {
      const taken = fields.username === TAKEN && !passwordIssue
      throw new HttpError(taken ? 409 : 400, taken ? 'username_taken' : 'invalid', 'Le formulaire contient des erreurs.', fields)
    }

    const day = today()
    const data = {
      username,
      usernameKey: usernameKey(username),
      passwordHash: await hashPassword(password),
      guestToken: null,
      createdOn: toDbDate(day),
    }
    // Le visiteur de ce navigateur devient le compte : ses parties, ses leçons et ses sardines
    // le suivent.
    const guest = await guestOf(req, res)
    let account
    try {
      account = guest
        ? await prisma.player.update({ where: { id: guest.id }, data })
        : await prisma.player.create({ data })
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      throw new HttpError(409, 'username_taken', 'Le formulaire contient des erreurs.', { username: TAKEN })
    }
    const claimed = await claimGuest(guest && account, account, day)
    forgetGuest(req, res)
    openSession(res, account)
    res.status(201).json({ user: await sessionUser(account, day), claimed })
  })
  .all(methodNotAllowed)

router
  .route('/auth/login')
  .post(async (req, res) => {
    const { username, password } = readCredentials(req.body)
    if (!username || !password) {
      const fields = {}
      if (!username) fields.username = 'Indique ton pseudo.'
      if (!password) fields.password = 'Indique ton mot de passe.'
      throw new HttpError(400, 'invalid', 'Le formulaire contient des erreurs.', fields)
    }

    // Les échecs sont comptés par pseudo, qu'il existe ou non : on ne révèle pas lesquels existent.
    const key = usernameKey(username)
    const now = Date.now()
    const recent = await prisma.loginFailure.findMany({
      where: { usernameKey: key, at: { gt: new Date(now - DAY_MS) } },
      orderBy: { at: 'asc' },
    })
    const retryAfter = lockedFor(recent.map((failure) => failure.at.getTime()), now)
    if (retryAfter > 0) {
      throw new HttpError(429, 'too_many_attempts', `Trop d’essais ratés. Réessaie dans ${formatDelay(retryAfter)}.`, { retryAfter })
    }

    const account = await prisma.player.findUnique({ where: { usernameKey: key } })
    if (!(await passwordMatches(password, account?.passwordHash))) {
      await prisma.loginFailure.create({ data: { usernameKey: key } })
      throw new HttpError(401, 'bad_credentials', 'Pseudo ou mot de passe incorrect.')
    }

    await prisma.loginFailure.deleteMany({ where: { usernameKey: key } })
    const day = today()
    const claimed = await claimGuest(await guestOf(req, res), account, day)
    forgetGuest(req, res)
    openSession(res, account)
    res.json({ user: await sessionUser(account, day), claimed })
  })
  .all(methodNotAllowed)

router
  .route('/auth/logout')
  .post((req, res) => {
    closeSession(res)
    forgetGuest(req, res)
    res.status(204).end()
  })
  .all(methodNotAllowed)

export default router
