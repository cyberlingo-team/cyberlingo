<script setup>
// Mon Tux : le personnage du joueur, sa fiche, son carnet des quatre dernières semaines et les
// stades qui l'attendent. Sans compte, l'œuf attend d'éclore.
import { computed } from 'vue'
import Balloon from '../components/comic/Balloon.vue'
import ErrorPanel from '../components/comic/ErrorPanel.vue'
import LoadingPanel from '../components/comic/LoadingPanel.vue'
import Picture from '../components/comic/Picture.vue'
import MuscleName from '../components/tux/MuscleName.vue'
import Ordinal from '../components/Ordinal.vue'
import StageLadder from '../components/tux/StageLadder.vue'
import TapeGauge from '../components/tux/TapeGauge.vue'
import { getGame, getMe } from '../api/index.js'
import { loadSession, session } from '../lib/session.js'
import { useResource } from '../lib/resource.js'
import { sceneImage, stageImage } from '../lib/images.js'
import { formatDay, formatFullDate, formatNumber, parseDate, plural, typo } from '../lib/format.js'

const { data, error, reload } = useResource(async () => {
  const user = await loadSession()
  if (session.status === 'error') throw session.error
  const [game, me] = await Promise.all([
    getGame(),
    user
      ? getMe().catch((cause) => {
          if (cause.status === 401) return null
          throw cause
        })
      : null,
  ])
  return { game, me }
})

const me = computed(() => data.value?.me || null)
const stages = computed(() => data.value?.game.stages || [])
const lastLevel = computed(() => stages.value.length - 1)

const remaining = computed(() => (me.value?.stage.next ? me.value.stage.next.minPoints - me.value.points : 0))

const streakLine = computed(() => {
  const streak = me.value.streak
  if (streak.current === 0) {
    return streak.lastPlayed ? 'Pas de série en cours. Un épisode aujourd’hui en relance une.' : 'Pas encore de série : elle commence avec ton premier épisode.'
  }
  if (streak.playedToday) return 'Épisode du jour joué : ta série est à l’abri jusqu’à demain.'
  return 'Pas encore joué aujourd’hui : ta série tient jusqu’à minuit.'
})

const successRate = computed(() => {
  const totals = me.value?.totals
  return totals && totals.questions ? Math.round((totals.correct / totals.questions) * 100) : null
})

// Le carnet : les quatre dernières semaines, du lundi au dimanche.
const WEEKDAYS = [
  ['L', 'lundi'],
  ['M', 'mardi'],
  ['M', 'mercredi'],
  ['J', 'jeudi'],
  ['V', 'vendredi'],
  ['S', 'samedi'],
  ['D', 'dimanche'],
]

const calendar = computed(() => {
  const days = me.value?.days || []
  if (!days.length) return []
  const offset = (parseDate(days[0].date).getDay() + 6) % 7
  return [...Array.from({ length: offset }, (_, i) => ({ blank: true, key: `blank-${i}` })), ...days.map((day) => ({ ...day, key: day.date }))]
})

function dayLabel(day) {
  const when = formatDay(day.date)
  if (day.status === 'played') return `${when} : joué, ${day.correct} sur ${day.total}, ${plural(day.points, 'point')}`
  if (day.status === 'missed') return `${when} : manqué, à rattraper`
  if (day.status === 'today') return `${when} : épisode du jour, à jouer`
  return `${when} : avant ton arrivée`
}

function dayLink(day) {
  return day.date === me.value.days.at(-1).date ? '/' : `/episode/${day.date}`
}
</script>

<template>
  <div class="page profile">
    <!-- Le titre de la page tant que le Tux n'est pas arrivé. -->
    <h1 v-if="!data" class="visually-hidden">Mon Tux</h1>
    <ErrorPanel v-if="error && !data" :error="error" :retry="reload" />
    <LoadingPanel v-else-if="!data" label="Chargement de ton Tux" />

    <!-- Sans compte : l'œuf. -->
    <template v-else-if="!me">
      <section class="egg panel">
        <Picture class="egg-image" :image="sceneImage('egg')" alt="Un œuf coiffé d’une toque, qui commence à se fendre." eager />
        <div class="egg-text">
          <h1 class="page-title">Ton Tux n’a pas encore éclos</h1>
          <p class="lead">
            Crée ton compte : il éclot à ton premier épisode, puis chaque bonne réponse lui donne du muscle. Ta série, tes
            points et ta place au classement sont gardés.
          </p>
          <div class="egg-actions">
            <RouterLink class="button" :to="{ path: '/inscription', query: { redirect: '/mon-tux' } }">Créer mon compte</RouterLink>
            <RouterLink class="button button--paper" :to="{ path: '/connexion', query: { redirect: '/mon-tux' } }">Se connecter</RouterLink>
          </div>
        </div>
      </section>
      <section class="block" aria-labelledby="ladder-title">
        <h2 id="ladder-title" class="block-title">Ce qu’il peut devenir</h2>
        <StageLadder class="panel ladder-panel" :stages="stages" />
      </section>
    </template>

    <!-- Avec compte : la fiche du personnage. -->
    <template v-else>
      <section class="hero panel" aria-labelledby="profile-name">
        <div class="hero-art">
          <div class="hero-burst" aria-hidden="true"></div>
          <Picture class="hero-tux" :image="stageImage(me.stage.level)" :alt="`Le Tux de ${me.user.username}, au stade ${me.stage.name}.`" eager />
        </div>
        <div class="hero-text">
          <h1 id="profile-name" class="hero-name">
            <MuscleName :name="me.user.username" :level="me.stage.level" />
          </h1>
          <p class="hero-stage">
            Stade {{ me.stage.level }} sur {{ lastLevel }} : <strong>{{ me.stage.name }}</strong>
          </p>
          <Balloon class="hero-motto" tail="left">{{ typo(me.stage.motto) }}</Balloon>
          <TapeGauge
            v-if="me.stage.next"
            :from="me.stage.minPoints"
            :to="me.stage.next.minPoints"
            :after="me.points"
            :label="`${plural(remaining, 'point')} avant le stade ${me.stage.next.name}`"
          />
          <p v-else class="hero-max">Dernier stade atteint. Les arnaques n’ont qu’à bien se tenir.</p>
          <p class="hero-points">{{ plural(me.points, 'point') }} depuis le {{ formatFullDate(me.user.createdAt) }}.</p>
        </div>
      </section>

      <section class="sheet panel panel--pad" aria-labelledby="sheet-title">
        <h2 id="sheet-title" class="block-title">Sa fiche</h2>
        <dl class="facts">
          <div class="fact">
            <dt>Série</dt>
            <dd>
              <strong>{{ plural(me.streak.current, 'jour') }}</strong>, record {{ plural(me.streak.best, 'jour') }}.
              <span class="fact-more">{{ streakLine }}</span>
              <RouterLink v-if="!me.streak.playedToday" to="/" class="fact-link">Jouer l’épisode du jour</RouterLink>
            </dd>
          </div>
          <div class="fact">
            <dt>Classement</dt>
            <dd>
              <strong v-if="me.rank.week"><Ordinal :rank="me.rank.week.position" /> sur {{ formatNumber(me.rank.week.players) }}</strong>
              <strong v-else>Pas classé</strong>
              ces 7 derniers jours<template v-if="me.rank.all">, <Ordinal :rank="me.rank.all.position" /> sur {{ formatNumber(me.rank.all.players) }} depuis le début.</template>
              <template v-else>, ni depuis le début.</template>
              <RouterLink to="/classement" class="fact-link">Voir le classement</RouterLink>
            </dd>
          </div>
          <div class="fact">
            <dt>Épisodes</dt>
            <dd>
              <strong>{{ formatNumber(me.totals.episodes) }}</strong> {{ me.totals.episodes >= 2 ? 'joués' : 'joué' }} le jour même<template v-if="successRate !== null">,
                {{ plural(me.totals.correct, 'bonne réponse', 'bonnes réponses') }} sur {{ formatNumber(me.totals.questions) }}
                ({{ successRate }} %)</template>.
            </dd>
          </div>
        </dl>
      </section>

      <section class="block" aria-labelledby="diary-title">
        <h2 id="diary-title" class="block-title">Ses quatre dernières semaines</h2>
        <div class="diary panel">
          <div class="diary-head" aria-hidden="true">
            <span v-for="([letter, name]) in WEEKDAYS" :key="name">{{ letter }}</span>
          </div>
          <ol class="diary-grid">
            <li v-for="day in calendar" :key="day.key" class="diary-cell" :class="day.blank ? 'is-blank' : `is-${day.status}`">
              <template v-if="!day.blank">
                <span v-if="day.status === 'before'" class="diary-day" :aria-label="dayLabel(day)">
                  {{ parseDate(day.date).getDate() }}
                </span>
                <RouterLink v-else :to="dayLink(day)" class="diary-day" :aria-label="dayLabel(day)">
                  <span class="diary-number">{{ parseDate(day.date).getDate() }}</span>
                  <span v-if="day.status === 'played'" class="diary-mark">{{ day.correct }}/{{ day.total }}</span>
                  <span v-else-if="day.status === 'missed'" class="diary-mark">manqué</span>
                  <span v-else class="diary-mark">à jouer</span>
                </RouterLink>
              </template>
            </li>
          </ol>
          <p class="diary-legend">Touche un jour pour relire l’épisode, ou le rattraper sans points.</p>
        </div>
      </section>

      <section class="block" aria-labelledby="ladder-title">
        <h2 id="ladder-title" class="block-title">Ses stades</h2>
        <StageLadder class="panel ladder-panel" :stages="stages" :level="me.stage.level" />
      </section>

      <p class="account-link">
        <RouterLink to="/mon-compte">Gérer mon compte</RouterLink> : changer de pseudo ou de mot de passe, se déconnecter.
      </p>
    </template>
  </div>
</template>

<style scoped>
.profile {
  gap: calc(var(--gutter) * 1.3);
}

.block {
  display: grid;
  gap: 10px;
}

.block-title {
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  font-weight: 850;
  font-stretch: 106%;
}

/* L'œuf du visiteur */
.egg {
  display: grid;
  grid-template-columns: minmax(110px, 200px) 1fr;
  gap: 20px;
  align-items: center;
  padding: clamp(14px, 3.5vw, 26px);
}

.egg-text {
  display: grid;
  gap: 12px;
}

.egg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ladder-panel {
  padding: 14px 10px 6px;
}

/* La fiche du personnage */
.hero {
  display: grid;
  grid-template-columns: minmax(150px, 0.8fr) 1.2fr;
  gap: clamp(12px, 3vw, 28px);
  align-items: center;
  padding: clamp(14px, 3.5vw, 26px);
  border-width: 4px;
  overflow: hidden;
}

.hero-art {
  position: relative;
  display: grid;
  place-items: center;
}

.hero-burst {
  position: absolute;
  inset: -12%;
  background-image: radial-gradient(var(--caption) 3.4px, transparent 3.8px);
  background-size: 11px 11px;
  -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
  mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
}

.hero-tux {
  position: relative;
  max-height: 320px;
  width: auto;
}

.hero-text {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.hero-name {
  font-size: clamp(1.9rem, 7vw, 3.2rem);
  line-height: 1;
  overflow-wrap: anywhere;
}

.hero-stage {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 600;
}

.hero-stage strong {
  font-weight: 900;
}

.hero-motto {
  justify-self: start;
  max-width: 36ch;
}

.hero-max {
  font-weight: 600;
}

.hero-points {
  color: var(--muted);
}

/* Les faits : une liste de définitions, pas des cartes. */
.sheet {
  display: grid;
  gap: 12px;
}

.facts {
  display: grid;
  gap: 0;
}

.fact {
  display: grid;
  grid-template-columns: 8.5rem 1fr;
  gap: 4px 16px;
  padding: 10px 0;
  border-top: 2px solid var(--rule);
}

.fact dt {
  font-family: var(--font-title);
  font-weight: 800;
}

.fact-more {
  display: block;
  color: var(--muted);
}

.fact-link {
  display: inline-block;
  margin-top: 4px;
  font-weight: 600;
}

/* Le carnet */
.diary {
  padding: 12px;
  display: grid;
  gap: 8px;
}

.diary-head,
.diary-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.diary-head {
  font-family: var(--font-title);
  font-weight: 800;
  text-align: center;
  font-size: 0.9rem;
}

.diary-grid {
  list-style: none;
  padding: 0;
}

.diary-cell {
  aspect-ratio: 1;
  min-height: 0;
}

.diary-day {
  display: grid;
  align-content: space-between;
  height: 100%;
  padding: 4px 5px;
  font-family: var(--font-title);
  color: var(--ink);
  text-decoration: none;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.diary-number {
  font-weight: 800;
  font-size: 0.95rem;
  line-height: 1;
}

/* « manqué » et « à jouer » tiennent sur une ligne, même dans les cases d'un petit téléphone. */
.diary-mark {
  font-size: 0.72rem;
  font-weight: 700;
  font-stretch: 82%;
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
}

.is-played .diary-day {
  background: var(--toque);
  color: var(--paper);
}

.is-missed .diary-day {
  background: var(--paper);
  color: var(--alert);
  border-color: var(--alert);
  border-style: dashed;
}

.is-today .diary-day {
  background: var(--caption);
  border-width: 3px;
}

.is-before .diary-day {
  border-color: var(--rule);
  color: var(--muted);
  background: transparent;
}

a.diary-day:hover {
  outline: 3px solid var(--ink);
  outline-offset: 1px;
}

.diary-legend {
  font-size: 0.9rem;
  color: var(--muted);
}

/* Sur grand écran, des cases plus larges que hautes : le mois tient sans faire défiler. */
@media (min-width: 700px) {
  .diary-cell {
    aspect-ratio: 1.6;
  }

  .diary-number {
    font-size: 1.1rem;
  }

  .diary-mark {
    font-size: 0.86rem;
  }
}

.account-link {
  padding-top: 6px;
  border-top: 2px solid var(--rule);
}

.account-link a {
  font-weight: 700;
}

@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .hero-art {
    justify-self: center;
  }

  .hero-tux {
    max-height: 220px;
  }

  .egg {
    grid-template-columns: 90px 1fr;
    align-items: start;
  }

  .fact {
    grid-template-columns: 1fr;
  }

  .diary-head,
  .diary-grid {
    gap: 4px;
  }

  .diary-day {
    padding: 3px;
  }

  .diary-mark {
    font-size: 0.62rem;
    font-stretch: 68%;
  }
}
</style>
