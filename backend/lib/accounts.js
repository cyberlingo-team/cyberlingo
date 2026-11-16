// Les règles des comptes : pseudo, mot de passe, et le frein contre qui devine les mots de
// passe. Elles suivent la recommandation de la CNIL (délibération n° 2022-100) :
//   - robustesse d'au moins 80 bits, calculée comme la CNIL : longueur × log2(taille de
//     l'alphabet utilisé), avec 26 minuscules, 26 majuscules, 10 chiffres et 40 autres signes ;
//     12 caractères des quatre sortes y suffisent, une phrase de passe aussi ;
//   - 64 caractères au plus, et 72 octets : bcrypt ne lit pas au-delà ;
//   - espaces et collage acceptés, mots de passe trop courants refusés, refus expliqué ;
//   - après 5 échecs, temporisation qui double à chaque nouvel échec (2 min, 4 min, 8 min…),
//     et 25 essais au plus par 24 heures.
// Le serveur simulé de l'interface applique les mêmes règles.

import bcrypt from 'bcryptjs'

export const ACCOUNT_RULES = {
  username: { minLength: 3, maxLength: 30 },
  password: {
    minBits: 80,
    maxLength: 64,
    maxBytes: 72,
    alphabets: { lowercase: 26, uppercase: 26, digits: 10, others: 40 },
  },
  login: { freeFailures: 5, firstDelaySeconds: 120, maxFailuresPerDay: 25 },
}

// Coût du hachage : 2^10 tours de bcrypt, un dixième de seconde environ. Assez pour ralentir
// qui volerait la base et essaierait des millions de mots de passe, assez peu pour l'utilisateur.
const BCRYPT_ROUNDS = 10

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// Un hachage de rien du tout, pour les pseudos qui n'existent pas : on le compare quand même, pour
// que la réponse prenne le même temps et ne trahisse pas quels pseudos existent.
const DECOY_HASH = bcrypt.hashSync('pas-un-vrai-mot-de-passe', BCRYPT_ROUNDS)

// Vrai si le mot de passe correspond au hachage. `hash` peut manquer (compte inconnu) : la
// vérification prend alors le même temps et renvoie faux.
export async function passwordMatches(password, hash) {
  if (typeof password !== 'string') return false
  const matches = await bcrypt.compare(password, hash || DECOY_HASH)
  return Boolean(hash) && matches
}

// Robustesse d'un mot de passe en bits, selon la méthode de la CNIL.
export function passwordBits(password) {
  const { alphabets } = ACCOUNT_RULES.password
  let size = 0
  if (/[a-z]/.test(password)) size += alphabets.lowercase
  if (/[A-Z]/.test(password)) size += alphabets.uppercase
  if (/[0-9]/.test(password)) size += alphabets.digits
  if (/[^a-zA-Z0-9]/.test(password)) size += alphabets.others
  return size ? Math.floor([...password].length * Math.log2(size)) : 0
}

// Les plus devinables : ceux que les pirates essaient en premier.
const GUESSABLE_PASSWORDS = [
  'motdepasse', 'password', 'azerty', 'qwerty', 'azertyuiop', 'qwertyuiop', '123456', '1234567890',
  'soleil', 'bonjour', 'doudou', 'loulou', 'chouchou', 'iloveyou', 'jetaime', 'cyberlingo', 'admin',
]

// Ce qui ne va pas dans un pseudo, en une phrase, ou null.
export function usernameProblem(username) {
  const { minLength, maxLength } = ACCOUNT_RULES.username
  if (!username) return 'Choisis un pseudo.'
  if (username.length < minLength) return `Ton pseudo doit faire au moins ${minLength} caractères.`
  if (username.length > maxLength) return `Ton pseudo doit faire au plus ${maxLength} caractères.`
  if (!/^[\p{L}\p{N}._-]+$/u.test(username)) return 'Lettres, chiffres, point, tiret et tiret bas seulement, sans espace.'
  return null
}

// Ce qui ne va pas dans un mot de passe, en une phrase, ou null.
export function passwordProblem(password, username) {
  const { minBits, maxLength, maxBytes } = ACCOUNT_RULES.password
  if (typeof password !== 'string' || !password) return 'Choisis un mot de passe.'
  if ([...password].length > maxLength || Buffer.byteLength(password, 'utf8') > maxBytes) {
    return `Trop long : ${maxLength} caractères au plus (un peu moins avec beaucoup d’accents).`
  }
  const simplified = password.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  const name = (username || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  if (name.length >= 3 && simplified.includes(name)) return 'Ton mot de passe ne doit pas contenir ton pseudo.'
  const withoutDigits = simplified.replace(/\d+/g, '')
  if (new Set(password).size < 5 || GUESSABLE_PASSWORDS.some((word) => withoutDigits === word || simplified === word)) {
    return 'Trop facile à deviner : c’est le genre de mot de passe que les pirates essaient en premier.'
  }
  if (passwordBits(password) < minBits) {
    return 'Pas encore assez solide. Allonge-le : une phrase de passe de plusieurs mots, ou 12 caractères mêlant majuscules, minuscules, chiffres et signes.'
  }
  return null
}

// Le pseudo tel qu'on le compare : sans tenir compte des majuscules.
export function usernameKey(username) {
  return username.toLowerCase()
}

export const DAY_MS = 24 * 60 * 60 * 1000

// Secondes à attendre avant le prochain essai, d'après les échecs des dernières 24 heures
// (horodatages en millisecondes, du plus ancien au plus récent).
export function lockedFor(failures, now) {
  const { freeFailures, firstDelaySeconds, maxFailuresPerDay } = ACCOUNT_RULES.login
  if (failures.length >= maxFailuresPerDay) {
    return Math.ceil((failures[failures.length - maxFailuresPerDay] + DAY_MS - now) / 1000)
  }
  if (failures.length < freeFailures) return 0
  const delay = firstDelaySeconds * 2 ** (failures.length - freeFailures)
  return Math.ceil((failures[failures.length - 1] + delay * 1000 - now) / 1000)
}

export function formatDelay(seconds) {
  if (seconds < 60) return `${seconds} secondes`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`
  const hours = Math.ceil(minutes / 60)
  return hours === 1 ? '1 heure' : `${hours} heures`
}
