// Qui fait la requête ? Deux cookies httpOnly, que le navigateur envoie tout seul et que le
// JavaScript de la page ne peut pas lire (une faille XSS ne pourrait donc pas les voler) :
//
//   session   un jeton JWT signé avec JWT_SECRET, qui contient l'identifiant du compte
//             (page /minimal/authentification du cours). Le serveur n'a rien à stocker : la
//             signature prouve que c'est lui qui l'a émis.
//   visiteur  l'identifiant aléatoire d'un visiteur sans compte (colonne Player.guestToken),
//             pour garder ses réponses et son chemin jusqu'à ce qu'il s'inscrive.
//
// Le middleware `readSession` (branché dans app.js) range le compte connecté dans
// `req.account`, ou null. Les routes « connecté » du contrat appellent `requireAccount(req)`.

import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'
import { HttpError } from './errors.js'
import { today, toDbDate } from './dates.js'

const SESSION_COOKIE = 'session'
const GUEST_COOKIE = 'visiteur'
const SESSION_DAYS = 30

const secret = process.env.JWT_SECRET
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET manque dans backend/.env (32 caractères au moins) : voir .env.example.')
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // En production, le site est servi en HTTPS : le cookie ne part jamais en clair.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  }
}

// Middleware : lit le cookie de session et charge le compte. Un jeton faux, expiré, ou qui
// désigne un compte supprimé vaut « pas de session ».
export async function readSession(req, res, next) {
  req.account = null
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) {
    try {
      const payload = jwt.verify(token, secret)
      const account = await prisma.player.findUnique({ where: { id: Number(payload.sub) } })
      if (account?.username) req.account = account
    } catch {
      // Jeton illisible : on fait comme s'il n'y en avait pas.
    }
    if (!req.account) res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined })
  }
  next()
}

export function requireAccount(req) {
  if (!req.account) throw new HttpError(401, 'not_authenticated', 'Connecte-toi pour accéder à cette page.')
  return req.account
}

// Ouvre la session d'un compte : pose le cookie avec un jeton tout neuf.
export function openSession(res, account) {
  const token = jwt.sign({ sub: String(account.id) }, secret, { expiresIn: `${SESSION_DAYS}d` })
  res.cookie(SESSION_COOKIE, token, cookieOptions())
}

export function closeSession(res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined })
}

// Le visiteur sans compte de ce navigateur, ou null. Avec `create: true`, il est créé (et son
// cookie posé) s'il n'existe pas encore : c'est ce que font les routes où il commence à jouer.
export async function guestOf(req, res, { create = false } = {}) {
  const token = req.cookies?.[GUEST_COOKIE]
  if (token) {
    const guest = await prisma.player.findUnique({ where: { guestToken: token } })
    if (guest && !guest.username) return guest
  }
  if (!create) return null
  const guest = await prisma.player.create({
    data: { guestToken: crypto.randomBytes(24).toString('base64url'), createdOn: toDbDate(today()) },
  })
  res.cookie(GUEST_COOKIE, guest.guestToken, cookieOptions())
  return guest
}

// Efface le cookie du visiteur, s'il y en a un (après l'inscription ou la connexion).
export function forgetGuest(req, res) {
  if (req.cookies?.[GUEST_COOKIE]) res.clearCookie(GUEST_COOKIE, { ...cookieOptions(), maxAge: undefined })
}

// Le joueur qui fait la requête : le compte connecté, sinon le visiteur (créé si demandé).
export async function playerOf(req, res, options) {
  return req.account || guestOf(req, res, options)
}
