# Le contrat de l'API CyberLingo

Ce fichier décrit chaque route que l'interface appelle : méthode, chemin, ce qu'elle envoie, ce
qu'elle reçoit, et les erreurs possibles. Le back-end Express devra le respecter à la lettre.

Pour l'instant, ces routes sont servies par un **serveur simulé** qui tourne dans le navigateur
(`simulation/`). Il répond comme le fera le vrai serveur, avec une petite latence, et vérifie les
réponses lui-même. Le jour où le back-end existe, il suffit de passer `USE_SIMULATION` à `false`
dans `http.js` : les écrans ne changent pas.

Les écrans n'appellent jamais `fetch` eux-mêmes. Ils passent par les fonctions de ce dossier,
une par route :

| Fonction | Route |
|---|---|
| `getSession()` | `GET /api/session` |
| `getAccountRules()` | `GET /api/auth/rules` |
| `signup(username, password)` | `POST /api/auth/signup` |
| `login(username, password)` | `POST /api/auth/login` |
| `logout()` | `POST /api/auth/logout` |
| `getMe()` | `GET /api/me` |
| `renameMe(username)` | `PATCH /api/me` |
| `changePassword(currentPassword, newPassword)` | `PUT /api/me/password` |
| `deleteAccount(password)` | `DELETE /api/me` |
| `getGame()` | `GET /api/game` |
| `getCast()` | `GET /api/cast` |
| `getTodayMission()` | `GET /api/missions/today` |
| `listMissions()` | `GET /api/missions` |
| `getMission(date)` | `GET /api/missions/:date` |
| `sendAnswer(date, questionId, answer)` | `POST /api/missions/:date/answers` |
| `getResult(date)` | `GET /api/missions/:date/result` |
| `getLeaderboard(period)` | `GET /api/leaderboard?period=week\|all` |

## Règles communes

**Format.** Tout est en JSON, en UTF-8. Les dates sont des chaînes `AAAA-MM-JJ`, au fuseau de
Paris : la mission du jour change à minuit, heure française. Les textes (messages, contenu des
épisodes) s'écrivent avec des espaces ordinaires, même devant « : ; ? ! » : l'interface pose
elle-même les espaces insécables du français (`typo()` dans `lib/format.js`).

**Session.** Elle est portée par un **cookie `httpOnly`** qui contient un JWT signé (page
`/minimal/authentification` du cours) : `HttpOnly`, `SameSite=Lax`, `Secure` en production,
`Path=/`. Le navigateur l'envoie tout seul ; l'interface ne voit jamais de jeton et demande à
`GET /api/session` qui est connecté. Le secret de signature vient d'une variable d'environnement
(`JWT_SECRET`, dans `.env`, jamais commitée).

**Visiteur sans compte.** On peut jouer l'épisode du jour sans compte. Le serveur garde les
réponses du visiteur dans une session anonyme (un second cookie `httpOnly`, par exemple un
identifiant aléatoire). À l'inscription ou à la connexion, ces réponses rejoignent le compte :
l'épisode du jour compte s'il n'était pas déjà joué, les épisodes passés deviennent des
rattrapages (voir `claimed`).

**Mots de passe.** Hachés et salés avec **bcryptjs** avant d'être stockés ; jamais renvoyés,
jamais écrits dans un journal. bcrypt ne lit que les 72 premiers octets : la règle des 72 octets
ci-dessous en découle.

**Erreurs.** Toute erreur a la même forme :

```json
{ "error": { "code": "invalid", "message": "Le formulaire contient des erreurs.", "fields": { "username": "Choisis un pseudo." } } }
```

- `code` : identifiant stable, que l'interface peut tester ;
- `message` : phrase en français, montrable telle quelle ;
- `fields` (facultatif) : un message par champ de formulaire fautif.

Erreurs possibles sur toutes les routes :

| Statut | `code` | Quand |
|---|---|---|
| 404 | `route_not_found` | la route n'existe pas |
| 405 | `method_not_allowed` | la route existe, pas avec cette méthode |
| 500 | `server_error` | erreur imprévue du serveur |

Quand le serveur ne répond pas du tout, `http.js` lève une erreur de statut `0` (code
`network`) : les écrans affichent alors « Le serveur ne répond pas » et un bouton « Réessayer ».

Les routes marquées **connecté** répondent `401 not_authenticated` sans session valide.

## Les objets échangés

### `SessionUser` : le joueur connecté, en bref

```json
{
  "username": "sacha_31",
  "createdAt": "2026-09-19",
  "points": 712,
  "stage": { "level": 4, "name": "Costaud" },
  "streak": { "current": 11, "playedToday": false }
}
```

### `Mission` : un épisode, sans ses réponses

```json
{
  "date": "2026-10-13",
  "number": 28,
  "title": "Le colis fantôme",
  "theme": "SMS de livraison",
  "hook": "Gaucho attend un colis. Un SMS arrive avant le livreur.",
  "guest": { "id": "gaucho", "name": "Gaucho", "tagline": "Dégaine son téléphone plus vite que son ombre.", "look": "Tux en gaucho…" },
  "questions": [Question]
}
```

`number` est le numéro de l'épisode depuis le lancement du site (le premier jour vaut 1).
`guest.id` désigne l'image du personnage dans l'interface (`src/assets/tux/gang/<id>.webp`) ;
`look` décrit l'image et sert de texte alternatif.

### `Question`

```json
{
  "id": "sms",
  "kind": "trap",
  "scene": "Mardi, 8 h 12. Le téléphone de Gaucho vibre.",
  "line": "Mon colis ! Enfin !",
  "artifact": { "kind": "sms", "sender": "06 39 98 21 47", "time": "08:12", "body": "Votre colis … {{lien|https://…}}" },
  "prompt": "Ce SMS, piège ou fiable ?"
}
```

- `kind` : `trap` (piège ou fiable), `truefalse` (vrai ou faux), `choice` (une proposition parmi
  plusieurs, avec `options: [{ id, text }]`) ou `clues` (toucher les indices dans l'objet, avec
  `pick`, le nombre d'indices à trouver) ;
- `line` : ce que dit le personnage invité, ou `null` ;
- `artifact` : l'objet à examiner, ou `null`. Dans ses textes, `{{zone|texte}}` délimite une zone
  qu'on peut toucher (questions `clues`) ou que le prof annote après la réponse.

Les objets possibles (`artifact.kind`) :

| `kind` | Champs |
|---|---|
| `sms` | `sender`, `time`, `body` |
| `email` | `fromName`, `fromAddress`, `subject`, `time`, `greeting?`, `body: [paragraphes]`, `button?`, `attachment?`, `footer?` |
| `browser` | `url`, `title`, `body?: [lignes]`, `fields?: [libellés]`, `cta?` |
| `call` | `caller`, `number?`, `lines: [{ who: 'caller' \| 'guest', text }]` |
| `chat` | `contact`, `number?`, `messages: [{ from: 'them' \| 'me', text, time? }]` |
| `popup` | `title`, `body: [lignes]`, `phone?`, `buttons?: [libellés]` |
| `post` | `author`, `handle?`, `time?`, `text`, `reactions?` |
| `wifi` | `place?`, `networks: [{ name, locked, signal: 1 \| 2 \| 3 }]` |
| `note` | `title?`, `lines: [lignes]`, `style?: 'postit' \| 'paper' \| 'label'` |
| `app` | `app`, `title`, `body: [lignes]`, `buttons?: [libellés]` |
| `qr` | `place`, `label`, `caption?`, `url?` |

La **réponse attendue** n'est jamais envoyée avec la question : le serveur la garde et ne la
révèle qu'après la réponse du joueur.

### `Answer` : ce qu'envoie le joueur

| `kind` | `answer` |
|---|---|
| `trap` | `"trap"` ou `"safe"` |
| `truefalse` | `true` ou `false` |
| `choice` | l'`id` d'une option |
| `clues` | un tableau d'exactement `pick` zones différentes, ex. `["expediteur", "lien"]` |

### `Revealed` : une réponse corrigée

```json
{
  "answer": "safe",
  "correct": false,
  "solution": "trap",
  "explanation": "Les vrais transporteurs ne demandent jamais de payer par SMS…",
  "notes": [{ "zone": "lien", "text": "Adresse inconnue du transporteur." }],
  "success": 71
}
```

`success` : part des joueurs, en pour cent, qui ont répondu juste à cette question.

### `Progress` : où en est le joueur dans un épisode

```json
{ "mode": "counted", "answers": { "sms": Revealed }, "answered": 1, "total": 5, "completed": false }
```

`mode` :

- `counted` : l'épisode compte pour le joueur connecté (celui du jour, ou un épisode passé qu'il
  avait joué le jour même) ;
- `guest` : l'épisode du jour joué sans compte ; rien ne compte tant qu'on ne s'inscrit pas ;
- `practice` : un épisode passé rattrapé ; la correction est la même, aucun point.

Un épisode commencé un jour et pas fini avant minuit devient un rattrapage.

### `Teaser` : l'épisode de demain, pour « À suivre »

```json
{ "date": "2026-10-14", "number": 29, "hook": "…", "guest": Guest, "villain": { "id": "banker", "name": "Léopold", "disguise": "en conseiller bancaire" } }
```

`villain` vaut `null` quand personne n'arnaque personne dans l'épisode. L'interface n'en montre
que la silhouette.

## Comptes et session

### `GET /api/session`

Qui est connecté sur ce navigateur ?

- Réponse `200` : `{ "user": SessionUser }`, ou `{ "user": null }` sans session.

### `GET /api/auth/rules`

Les règles des comptes, pour guider la saisie. Le serveur les vérifie de son côté.

- Réponse `200` :

```json
{
  "username": { "minLength": 3, "maxLength": 30 },
  "password": {
    "minBits": 80,
    "maxLength": 64,
    "maxBytes": 72,
    "alphabets": { "lowercase": 26, "uppercase": 26, "digits": 10, "others": 40 }
  }
}
```

Le mot de passe suit la recommandation de la CNIL (délibération n° 2022-100) : une robustesse
d'au moins 80 bits, calculée comme `longueur × log2(taille de l'alphabet utilisé)`, avec les
tailles d'alphabet ci-dessus. Espaces et collage sont acceptés. Sont refusés : les mots de passe
trop courants (`motdepasse`, `azerty`, `123456`…), ceux qui contiennent le pseudo, et ceux de
moins de 5 caractères différents. Le pseudo : lettres (accents compris), chiffres, `.`, `-` et
`_`, sans espace ; il est unique sans tenir compte des majuscules.

### `POST /api/auth/signup`

Crée un compte et ouvre la session.

- Envoi : `{ "username": "tux_curieux", "password": "…" }`
- Réponse `201` : `{ "user": SessionUser, "claimed": Claimed | null }`, et le cookie de session.
- `Claimed`, quand le visiteur avait déjà répondu à l'épisode du jour sans compte :
  `{ "date": "2026-10-13", "answered": 5, "completed": true, "points": 62 }`.

| Statut | `code` | Quand |
|---|---|---|
| 400 | `invalid` | pseudo ou mot de passe refusé ; détail dans `fields.username`, `fields.password` |
| 409 | `username_taken` | pseudo déjà pris (`fields.username`) |

### `POST /api/auth/login`

- Envoi : `{ "username": "sacha_31", "password": "…" }`
- Réponse `200` : `{ "user": SessionUser, "claimed": Claimed | null }`, et le cookie de session.

| Statut | `code` | Quand |
|---|---|---|
| 400 | `invalid` | champ vide (`fields`) |
| 401 | `bad_credentials` | « Pseudo ou mot de passe incorrect. » Le même message que le pseudo existe ou non. |
| 429 | `too_many_attempts` | trop d'échecs ; `fields.retryAfter` donne l'attente en secondes |

Les échecs sont comptés par pseudo sur 24 heures : les 5 premiers sont libres, puis il faut
attendre 2 minutes, puis 4, 8… (le délai double à chaque échec), et 25 échecs au plus par
24 heures. Une connexion réussie remet le compte à zéro.

### `POST /api/auth/logout`

- Réponse `204`, et le cookie de session effacé. Sans session, même réponse.

## Le joueur connecté

### `GET /api/me` (connecté)

Tout ce que montre la page « Mon Tux ».

- Réponse `200` :

```json
{
  "user": { "username": "sacha_31", "createdAt": "2026-09-19" },
  "points": 712,
  "stage": { "level": 4, "name": "Costaud", "minPoints": 700, "motto": "…", "next": { "level": 5, "name": "Balèze", "minPoints": 1050 } },
  "streak": { "current": 11, "best": 11, "playedToday": false, "lastPlayed": "2026-10-12" },
  "rank": { "week": { "position": 12, "players": 195 }, "all": { "position": 30, "players": 214 } },
  "totals": { "episodes": 21, "correct": 84, "questions": 103 },
  "days": [{ "date": "2026-09-16", "number": 1, "title": "…", "status": "before" }, "… 28 jours, du plus ancien à aujourd'hui"]
}
```

- `stage.next` vaut `null` au dernier stade ; `rank.week` ou `rank.all` vaut `null` sans points
  sur la période.
- `days[].status` : `played` (avec `correct`, `total`, `points`), `missed`, `today` (pas encore
  joué) ou `before` (avant la création du compte).

### `PATCH /api/me` (connecté)

Change de pseudo. Les points, la série et le classement suivent.

- Envoi : `{ "username": "nouveau_pseudo" }`
- Réponse `200` : `{ "user": SessionUser }`

| Statut | `code` | Quand |
|---|---|---|
| 400 | `invalid` | pseudo refusé (`fields.username`) |
| 409 | `username_taken` | pseudo déjà pris (`fields.username`) |

### `PUT /api/me/password` (connecté)

- Envoi : `{ "currentPassword": "…", "newPassword": "…" }`
- Réponse `204`.

| Statut | `code` | Quand |
|---|---|---|
| 403 | `wrong_password` | mot de passe actuel faux (`fields.currentPassword`) |
| 400 | `invalid` | nouveau mot de passe refusé, ou identique à l'actuel (`fields.newPassword`) |

### `DELETE /api/me` (connecté)

Supprime le compte, ses réponses et ses points, et ferme la session.

- Envoi : `{ "password": "…" }`
- Réponse `204`, et le cookie de session effacé.

| Statut | `code` | Quand |
|---|---|---|
| 403 | `wrong_password` | mot de passe faux (`fields.password`) |

## Les règles du jeu et les personnages

### `GET /api/game`

- Réponse `200` :

```json
{
  "stages": [{ "level": 0, "name": "Poussin", "minPoints": 0, "motto": "Il vient d’éclore. Il clique encore sur tout." }, "… 8 stades"],
  "scoring": { "correctAnswer": 10, "perfectBonus": 10, "streakBonusPerDay": 2, "streakBonusMaxDays": 10 }
}
```

Points d'un épisode joué le jour même : 10 par bonne réponse, 10 de plus pour un sans-faute, et
2 par jour de série en comptant ce jour-là, jusqu'à 10 jours (20 points). Les rattrapages ne
rapportent rien. Le stade du Tux dépend du total des points.

### `GET /api/cast`

- Réponse `200` :

```json
{
  "gang": [{ "id": "gaucho", "name": "Gaucho", "tagline": "…", "look": "…" }, "… 12 personnages"],
  "villain": { "name": "Léopold", "tagline": "…", "disguises": [{ "id": "fisher", "label": "en pêcheur" }, "…"] }
}
```

## Les épisodes

### `GET /api/missions/today`

L'épisode du jour, le même pour tout le monde, avec ou sans compte.

- Réponse `200` :

```json
{
  "mission": Mission,
  "progress": Progress,
  "stats": { "players": 82, "successRate": 69 },
  "next": Teaser
}
```

`stats` : joueurs qui ont déjà fini l'épisode aujourd'hui, et leur part de bonnes réponses
(`successRate` vaut `null` s'il n'y en a aucun).

### `GET /api/missions`

Tous les épisodes parus, du plus récent au plus ancien.

- Réponse `200` : `{ "episodes": [Episode] }`

```json
{
  "date": "2026-10-12",
  "number": 27,
  "title": "…",
  "theme": "…",
  "guest": Guest,
  "villain": { "id": "courier", "name": "Léopold", "disguise": "en livreur" },
  "questionCount": 5,
  "status": "played",
  "score": { "correct": 4, "total": 5, "points": 62 },
  "stats": { "players": 140, "successRate": 74 }
}
```

- `status` : `played` (joué le jour même), `practiced` (rattrapé jusqu'au bout), `started`
  (commencé), `today` (celui du jour, pas commencé), `missed` (manqué depuis l'inscription) ou
  `unplayed` (paru avant l'inscription, ou visiteur sans compte) ;
- `villain` n'est rempli que pour `played` et `practiced` : on ne démasque Léopold qu'en finissant
  l'épisode ;
- `score` vaut `null` sauf pour `played` et `practiced` (où `points` vaut 0).

### `GET /api/missions/:date`

Un épisode paru, pour le relire ou le rattraper.

- Réponse `200` : `{ "mission": Mission, "progress": Progress }`

| Statut | `code` | Quand |
|---|---|---|
| 404 | `mission_not_found` | date mal écrite, ou aucun épisode paru ce jour-là (avant le lancement, ou dans le futur) |

### `POST /api/missions/:date/answers`

Répond à une question. Une seule réponse par question : on ne peut pas se corriger.

- Envoi : `{ "questionId": "sms", "answer": Answer }`
- Réponse `200` : `Revealed`, plus `progress` (sans `answers`) :
  `{ …Revealed, "progress": { "mode": "counted", "answered": 2, "total": 5, "completed": false } }`

Quand la dernière question d'un épisode `counted` reçoit sa réponse, le serveur calcule les
points de l'épisode et met à jour la série.

| Statut | `code` | Quand |
|---|---|---|
| 400 | `invalid_answer` | la réponse ne correspond pas au type de question |
| 404 | `mission_not_found` | pas d'épisode à cette date |
| 404 | `question_not_found` | la question n'est pas dans l'épisode |
| 409 | `already_answered` | déjà répondu à cette question |
| 409 | `already_completed` | épisode déjà joué et clos |

### `GET /api/missions/:date/result`

La fin de l'épisode, une fois toutes les questions répondues.

- Réponse `200` :

```json
{
  "date": "2026-10-13",
  "number": 28,
  "title": "Le colis fantôme",
  "mode": "counted",
  "correct": 4,
  "total": 5,
  "moral": "…",
  "sources": [{ "label": "Cybermalveillance.gouv.fr : l’hameçonnage", "url": "https://…" }],
  "villain": { "id": "courier", "name": "Léopold", "disguise": "en livreur", "quip": "Bon. Je retourne au vestiaire." },
  "points": { "answers": 40, "perfect": 0, "streak": 20, "total": 60 },
  "player": {
    "before": { "points": 652, "stage": Stage },
    "after": { "points": 712, "stage": Stage },
    "streak": { "current": 12, "best": 12 }
  },
  "rank": {
    "period": "week",
    "position": 9,
    "previous": 12,
    "players": 195,
    "ahead": { "username": "malo.dlt", "rank": 8, "level": 4, "gap": 6 },
    "next": { "date": "2026-10-14", "maxPoints": 82 }
  },
  "next": Teaser
}
```

- `villain` vaut `null` quand personne n'arnaque personne dans l'épisode ;
- `points` : pour `counted`, ce que l'épisode a rapporté ; pour `guest`, ce qu'il rapporterait
  avec un compte ; `null` pour `practice` ;
- `player` et `rank` ne sont remplis que pour l'épisode du jour d'un joueur connecté. `Stage` a la
  forme de `stage` dans `GET /api/me` (sans `motto`) ; `rank.previous` est la place avant
  l'épisode (`null` si le joueur n'était pas classé) ; `rank.ahead` est le joueur juste devant
  (`null` en tête) ; `rank.next` est le prochain épisode qui peut rapporter des points et son
  maximum, bonus de série compris.

| Statut | `code` | Quand |
|---|---|---|
| 404 | `mission_not_found` | pas d'épisode à cette date |
| 409 | `not_finished` | toutes les questions n'ont pas de réponse |

## Le classement

### `GET /api/leaderboard?period=week|all`

- `period=week` : les 7 derniers jours, aujourd'hui compris ; `period=all` : depuis le lancement.
- Réponse `200` :

```json
{
  "period": "week",
  "from": "2026-10-07",
  "to": "2026-10-13",
  "players": 195,
  "top": [{ "rank": 1, "username": "…", "points": 540, "level": 7, "streak": 28, "me": false }, "… 10 premiers"],
  "around": ["… le joueur connecté et ses voisins, s'il n'est pas dans les 10 premiers"],
  "me": { "rank": 12, "username": "sacha_31", "points": 412, "level": 4, "streak": 11, "me": true, "ahead": Ahead, "next": { "date": "2026-10-13", "maxPoints": 82 } }
}
```

- Seuls les joueurs qui ont des points sur la période sont classés. À points égaux, même rang.
- `me` vaut `null` sans session, ou si le joueur n'a pas de points sur la période.

| Statut | `code` | Quand |
|---|---|---|
| 400 | `invalid_period` | période autre que `week` ou `all` |

## Le serveur simulé

Il garde ses données dans le `localStorage` du navigateur et se cale sur la date du jour : le
site a « ouvert » il y a 27 jours, et les quelque 200 joueurs simulés ont un passé crédible,
quel que soit le jour où l'on tourne la vidéo. Le contenu des épisodes
(`simulation/missions/`) est écrit pour être repris tel quel dans le `seed.js` du back-end.

**Comptes de démonstration.** Mot de passe commun : `banquise-sardine-parapluie`.

| Pseudo | Ce qu'il montre |
|---|---|
| `sacha_31` | l'habitué : une série en cours, l'épisode du jour pas encore joué |
| `malo.dlt` | la série perdue : il n'a pas joué hier |
| `Capitaine_des_mots_de_passe_42` | le pseudo de 30 caractères, au dernier stade, épisode du jour déjà joué |

Ils repartent chaque jour de cet état : leur passé se recale sur la date, et ce qu'on a joué avec
eux les jours précédents est effacé. Les comptes créés dans le navigateur, eux, gardent tout.

**Modes**, à ajouter à n'importe quelle adresse (ils valent pour tout l'onglet) :

- `?simulation=lent` : chaque requête prend deux à trois secondes (écrans de chargement) ;
- `?simulation=panne` : le serveur ne répond plus (écrans d'erreur) ;
- `?simulation=normal` : retour à la normale ;
- `?simulation=reinitialiser` : efface les comptes créés et les parties jouées dans ce navigateur.

Le serveur simulé hache les mots de passe avec SHA-256 et un sel, faute de bcrypt dans le
navigateur ; le vrai serveur utilisera **bcryptjs**.
