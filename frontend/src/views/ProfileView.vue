<script setup>
// Mon Tux : le personnage du joueur à son stade, ce qui lui manque pour le suivant, ses chiffres,
// sa semaine, ses succès et le carnet des missions du jour. Sans compte, l'œuf attend d'éclore.
import { computed } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { getGame, getMe } from '../api/index.js'
import { loadSession, session } from '../lib/session.js'
import { useResource } from '../lib/resource.js'
import { sceneImage, stageImage } from '../lib/images.js'
import { formatDay, formatFullDate, formatNumber, formatWeekday, parseDate, plural, typo } from '../lib/format.js'

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

// La jauge jusqu'au stade suivant.
const next = computed(() => me.value?.stage.next || null)
const remaining = computed(() => (next.value ? next.value.minPoints - me.value.points : 0))
const progress = computed(() => {
  if (!next.value) return 100
  const span = next.value.minPoints - me.value.stage.minPoints
  return Math.max(0, Math.min(100, ((me.value.points - me.value.stage.minPoints) / span) * 100))
})

const tiles = computed(() => {
  const m = me.value
  const rate = m.totals.questions ? Math.round((m.totals.correct / m.totals.questions) * 100) : null
  return [
    { id: 'streak', icon: 'flamme', value: m.streak.current, label: m.streak.current > 1 ? 'jours de série' : 'jour de série', off: !m.streak.playedToday },
    { id: 'points', icon: 'haltere', value: formatNumber(m.points), label: 'points au total' },
    { id: 'lessons', icon: 'igloo', value: m.totals.lessons, label: m.totals.lessons > 1 ? 'leçons réussies' : 'leçon réussie' },
    { id: 'missions', icon: 'trophee', value: m.totals.episodes, label: m.totals.episodes > 1 ? 'missions du jour' : 'mission du jour' },
    { id: 'rate', icon: 'cible', value: rate === null ? '–' : `${rate} %`, label: 'de bonnes réponses' },
    { id: 'rank', icon: 'podium', value: m.rank.week ? `${m.rank.week.position}${m.rank.week.position === 1 ? 're' : 'e'}` : '–', label: 'cette semaine' },
  ]
})

const streakLine = computed(() => {
  const streak = me.value.streak
  if (streak.current === 0) return 'Pas de série en cours : la mission du jour en relance une.'
  if (streak.playedToday) return 'Mission du jour faite : ta série est à l’abri jusqu’à demain.'
  return 'Pas encore de mission aujourd’hui : ta série tient jusqu’à minuit.'
})

// La semaine en barres : la plus haute prend toute la hauteur.
const week = computed(() => {
  const days = me.value?.week || []
  const top = Math.max(1, ...days.map((day) => day.points))
  return days.map((day, i) => ({
    ...day,
    height: (day.points / top) * 100,
    short: i === days.length - 1 ? 'Auj.' : formatWeekday(day.date).slice(0, 3),
  }))
})
const weekTotal = computed(() => week.value.reduce((sum, day) => sum + day.points, 0))

// Le carnet des missions du jour : les dernières semaines, du lundi au dimanche.
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
  if (day.status === 'played') return `${when} : faite, ${day.correct} sur ${day.total}, ${plural(day.points, 'point')}`
  if (day.status === 'missed') return `${when} : manquée`
  if (day.status === 'today') return `${when} : mission du jour, à faire`
  return `${when} : avant ton arrivée`
}
</script>

<template>
  <AppShell width="wide">
    <h1 v-if="!data" class="visually-hidden">Mon Tux</h1>
    <StatePanel v-if="error && !data" state="error" :error="error" :retry="reload" />
    <StatePanel v-else-if="!data" label="Ton Tux arrive…" />

    <!-- Sans compte : l'œuf. -->
    <div v-else-if="!me" class="profile">
      <section class="card card--pad egg">
        <img :src="sceneImage('egg').src" alt="Un œuf coiffé d’une toque, qui commence à se fendre." class="egg-image" />
        <div class="egg-text">
          <h1 class="section-title">Ton Tux n’a pas encore éclos</h1>
          <p class="muted">Crée un profil : il éclot à ta première leçon, puis chaque bonne réponse lui donne du muscle. Ta série, tes points et ta place au classement sont gardés.</p>
          <div class="egg-actions">
            <RouterLink class="button" :to="{ path: '/inscription', query: { redirect: '/mon-tux' } }">Créer un profil</RouterLink>
            <RouterLink class="button button--ghost" :to="{ path: '/connexion', query: { redirect: '/mon-tux' } }">Se connecter</RouterLink>
          </div>
        </div>
      </section>

      <section class="block" aria-labelledby="ladder-title">
        <h2 id="ladder-title" class="section-title">Ce qu’il peut devenir</h2>
        <ol class="card card--pad ladder">
          <li v-for="stage in stages" :key="stage.level" class="rung" :style="{ '--grow': stage.level }">
            <img :src="stageImage(stage.level, { mini: true }).src" :alt="stage.name" class="rung-tux" />
            <span class="rung-name">{{ stage.name }}</span>
            <span class="rung-points">{{ stage.minPoints ? `${formatNumber(stage.minPoints)} pts` : 'au départ' }}</span>
          </li>
        </ol>
      </section>

      <RouterLink to="/preferences" class="mobile-link">Préférences</RouterLink>
    </div>

    <!-- Avec compte : la fiche du personnage. -->
    <div v-else class="profile">
      <section class="hero" aria-labelledby="profile-name">
        <div class="hero-art">
          <img :src="stageImage(me.stage.level).src" :alt="`Le Tux de ${me.user.username}, au stade ${me.stage.name}.`" class="hero-tux" />
        </div>
        <div class="hero-text">
          <h1 id="profile-name" class="hero-name">{{ me.user.username }}</h1>
          <p class="hero-since">Sur la banquise depuis le {{ formatFullDate(me.user.createdAt) }}</p>
          <p class="hero-stage">
            <span class="stage-badge">Stade {{ me.stage.level }} / {{ lastLevel }}</span>
            <strong>{{ me.stage.name }}</strong>
          </p>
          <p class="hero-motto">« {{ typo(me.stage.motto) }} »</p>
          <div v-if="next" class="gauge">
            <div class="gauge-labels">
              <span>{{ plural(remaining, 'point') }} avant <strong>{{ next.name }}</strong></span>
              <span class="muted">{{ formatNumber(me.points) }} / {{ formatNumber(next.minPoints) }}</span>
            </div>
            <div class="meter" role="progressbar" :aria-valuenow="me.points" :aria-valuemin="me.stage.minPoints" :aria-valuemax="next.minPoints" :aria-label="`Points jusqu’au stade ${next.name}`">
              <div class="meter-fill" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>
          <p v-else class="hero-max">Dernier stade atteint. Les arnaques n’ont qu’à bien se tenir.</p>
        </div>
      </section>

      <section class="block" aria-labelledby="stats-title">
        <h2 id="stats-title" class="section-title">Statistiques</h2>
        <ul class="tiles">
          <li v-for="tile in tiles" :key="tile.id" class="tile" :class="{ 'is-off': tile.off }">
            <Icon :name="tile.icon" :size="34" />
            <div>
              <p class="tile-value">{{ tile.value }}</p>
              <p class="tile-label">{{ tile.label }}</p>
            </div>
          </li>
        </ul>
        <p class="streak-line muted">{{ streakLine }}<template v-if="me.streak.best > 1"> Record : {{ plural(me.streak.best, 'jour') }}.</template></p>
      </section>

      <section class="block" aria-labelledby="week-title">
        <div class="block-head">
          <h2 id="week-title" class="section-title">Ta semaine</h2>
          <p class="muted">{{ plural(weekTotal, 'point') }} en 7 jours</p>
        </div>
        <div class="card card--pad chart">
          <ol class="bars">
            <li v-for="day in week" :key="day.date" class="bar" :class="{ 'is-today': day === week.at(-1) }">
              <span class="bar-value">{{ day.points || '' }}</span>
              <span class="bar-track"><span class="bar-fill" :style="{ height: `${day.height}%` }"></span></span>
              <span class="bar-day" :title="formatDay(day.date)">{{ day.short }}</span>
              <span class="visually-hidden">{{ formatDay(day.date) }} : {{ plural(day.points, 'point') }}</span>
            </li>
          </ol>
        </div>
      </section>

      <section class="block" aria-labelledby="achievements-title">
        <h2 id="achievements-title" class="section-title">Succès</h2>
        <ul class="card achievements">
          <li v-for="item in me.achievements" :key="item.id" class="achievement" :class="{ 'is-locked': item.level === 0 }">
            <span class="achievement-badge">
              <Icon :name="item.icon" :size="46" />
              <span class="achievement-level">Niv. {{ item.level }}</span>
            </span>
            <div class="achievement-body">
              <div class="achievement-head">
                <p class="achievement-title">{{ item.title }}</p>
                <p class="muted achievement-count">{{ item.level }} / {{ item.maxLevel }}</p>
              </div>
              <div class="meter" role="progressbar" :aria-valuenow="Math.min(item.value, item.goal)" aria-valuemin="0" :aria-valuemax="item.goal" :aria-label="item.title">
                <div class="meter-fill" :data-empty="item.value === 0" :style="{ width: `${Math.min(100, (item.value / item.goal) * 100)}%` }"></div>
              </div>
              <p class="achievement-goal muted">
                <template v-if="item.level === item.maxLevel">Niveau maximum : {{ item.value }} {{ item.unit }}.</template>
                <template v-else>{{ item.value }} / {{ item.goal }} {{ item.unit }}</template>
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section class="block" aria-labelledby="calendar-title">
        <h2 id="calendar-title" class="section-title">Le carnet des missions du jour</h2>
        <div class="card card--pad">
          <div class="calendar" role="list">
            <span v-for="[letter, name] in WEEKDAYS" :key="name" class="calendar-head" aria-hidden="true">{{ letter }}</span>
            <span v-for="day in calendar" :key="day.key" role="listitem" class="calendar-day" :class="day.blank ? 'is-blank' : `is-${day.status}`" :title="day.blank ? undefined : dayLabel(day)">
              <template v-if="!day.blank">
                <span aria-hidden="true">{{ parseDate(day.date).getDate() }}</span>
                <span class="visually-hidden">{{ dayLabel(day) }}</span>
              </template>
            </span>
          </div>
          <ul class="legend">
            <li><span class="dot is-played"></span>Faite</li>
            <li><span class="dot is-missed"></span>Manquée</li>
            <li><span class="dot is-today"></span>Aujourd’hui</li>
          </ul>
        </div>
      </section>

      <section class="block" aria-labelledby="ladder-title">
        <h2 id="ladder-title" class="section-title">Les stades du Tux</h2>
        <ol class="card card--pad ladder">
          <li
            v-for="stage in stages"
            :key="stage.level"
            class="rung"
            :class="{ 'is-current': stage.level === me.stage.level, 'is-locked': stage.level > me.stage.level }"
            :style="{ '--grow': stage.level }"
          >
            <img :src="stageImage(stage.level, { mini: true }).src" :alt="stage.level > me.stage.level ? 'Stade pas encore atteint' : stage.name" class="rung-tux" />
            <span class="rung-name">{{ stage.level > me.stage.level ? '?' : stage.name }}</span>
            <span class="rung-points">{{ stage.minPoints ? `${formatNumber(stage.minPoints)} pts` : 'au départ' }}</span>
          </li>
        </ol>
      </section>

      <nav class="mobile-links" aria-label="Réglages">
        <RouterLink to="/preferences" class="mobile-link">Préférences</RouterLink>
        <RouterLink to="/mon-compte" class="mobile-link">Mon compte</RouterLink>
      </nav>
    </div>
  </AppShell>
</template>

<style scoped>
.profile {
  display: grid;
  gap: 36px;
}

.block {
  display: grid;
  gap: 14px;
}

.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

/* --- L'en-tête */

.hero {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  align-items: center;
  gap: 28px;
  padding-bottom: 28px;
  border-bottom: 2px solid var(--rule);
}

.hero-art {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  background: var(--toque-pale);
  border-radius: 50%;
}

.hero-tux {
  width: 82%;
  height: 82%;
  object-fit: contain;
}

.hero-text {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.hero-name {
  font-size: clamp(1.6rem, 4vw, 2.1rem);
  overflow-wrap: anywhere;
}

.hero-since {
  color: var(--muted);
}

.hero-stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 1.15rem;
  color: var(--toque);
}

.stage-badge {
  padding: 2px 10px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: var(--toque-bright);
  border-radius: 999px;
}

.hero-motto {
  font-style: italic;
  color: var(--muted);
}

.gauge {
  display: grid;
  gap: 6px;
  margin-top: 6px;
}

.gauge-labels {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  font-size: 0.95rem;
}

.hero-max {
  font-weight: 700;
  color: var(--success-ink);
}

/* --- Les statistiques */

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
  padding: 0;
  list-style: none;
}

.tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.tile.is-off :deep(.icon) {
  filter: grayscale(1);
  opacity: 0.6;
}

.tile-value {
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.1;
}

.tile-label {
  font-size: 0.88rem;
  color: var(--muted);
}

.streak-line {
  font-size: 0.95rem;
}

/* --- La semaine */

.bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  padding: 0;
  list-style: none;
}

.bar {
  display: grid;
  grid-template-rows: auto 140px auto;
  justify-items: center;
  gap: 6px;
}

.bar-value {
  min-height: 1.2em;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--toque);
}

.bar-track {
  position: relative;
  width: 100%;
  max-width: 40px;
  background: var(--wash);
  border-radius: 10px;
}

.bar-fill {
  position: absolute;
  inset: auto 0 0 0;
  min-height: 4px;
  background: var(--toque-bright);
  border-radius: 10px;
  box-shadow: inset 0 -4px 0 var(--toque);
}

.bar.is-today .bar-fill {
  background: var(--beak);
  box-shadow: inset 0 -4px 0 var(--beak-deep);
}

.bar-day {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: capitalize;
  color: var(--muted);
}

.bar.is-today .bar-day {
  color: var(--beak-ink);
}

/* --- Les succès */

.achievements {
  display: grid;
  padding: 0;
  list-style: none;
}

.achievement {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 20px;
}

.achievement + .achievement {
  border-top: 2px solid var(--rule);
}

.achievement-badge {
  position: relative;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 76px;
  height: 84px;
  padding-bottom: 10px;
  background: var(--beak-pale);
  border: 2px solid #ffd0a3;
  border-radius: var(--radius);
}

.achievement-level {
  position: absolute;
  bottom: 4px;
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--beak-ink);
}

.achievement.is-locked .achievement-badge {
  background: var(--wash);
  border-color: var(--rule);
}

.achievement.is-locked .achievement-badge :deep(.icon) {
  filter: grayscale(1);
  opacity: 0.5;
}

.achievement.is-locked .achievement-level {
  color: var(--muted);
}

.achievement-body {
  display: grid;
  flex: 1;
  gap: 8px;
  min-width: 0;
}

.achievement-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.achievement-title {
  font-size: 1.1rem;
  font-weight: 800;
}

.achievement-count,
.achievement-goal {
  font-size: 0.9rem;
}

/* --- Le carnet */

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  max-width: 420px;
  margin: 0 auto;
}

.calendar-head {
  font-size: 0.8rem;
  font-weight: 900;
  text-align: center;
  color: var(--muted);
}

.calendar-day {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  font-size: 0.85rem;
  font-weight: 800;
  color: #9aa0b4;
  border-radius: 50%;
}

.calendar-day.is-played {
  color: #fff;
  background: var(--beak);
}

.calendar-day.is-missed {
  color: var(--alert-ink);
  background: var(--alert-pale);
}

.calendar-day.is-today {
  color: var(--toque-bright);
  box-shadow: inset 0 0 0 2px var(--toque-bright);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 18px;
  margin-top: 14px;
  padding: 0;
  font-size: 0.85rem;
  color: var(--muted);
  list-style: none;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.is-played {
  background: var(--beak);
}

.dot.is-missed {
  background: var(--alert-pale);
  box-shadow: inset 0 0 0 1px var(--alert);
}

.dot.is-today {
  box-shadow: inset 0 0 0 2px var(--toque-bright);
}

/* --- L'échelle des stades */

.ladder {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  align-items: end;
  gap: 6px;
  margin: 0;
  list-style: none;
}

.rung {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 6px 2px;
  text-align: center;
  border-radius: var(--radius-small);
}

.rung-tux {
  width: calc(50% + var(--grow) * 7%);
  max-width: 100%;
}

.rung.is-locked .rung-tux {
  filter: brightness(0) opacity(0.18);
}

.rung.is-current {
  background: var(--toque-pale);
  box-shadow: inset 0 0 0 2px var(--toque-line);
}

.rung-name {
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.2;
}

.rung-points {
  font-size: 0.7rem;
  color: var(--muted);
}

/* --- Sans compte */

.egg {
  display: flex;
  align-items: center;
  gap: 24px;
}

.egg-image {
  flex-shrink: 0;
  width: 150px;
}

.egg-text {
  display: grid;
  gap: 12px;
}

.egg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* Le menu « Plus » n'existe pas sur téléphone : les réglages sont ici. */
.mobile-links {
  display: none;
  gap: 12px;
}

.mobile-link {
  display: none;
  padding: 14px 18px;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

@media (max-width: 699px) {
  .mobile-links {
    display: grid;
  }

  .mobile-link {
    display: block;
  }
}

@media (max-width: 600px) {
  .hero {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .hero-art {
    width: 170px;
  }

  .hero-stage {
    justify-content: center;
  }

  .gauge {
    width: 100%;
    text-align: left;
  }

  .tiles {
    grid-template-columns: 1fr 1fr;
  }

  .tile {
    padding: 12px;
  }

  .bars {
    gap: 6px;
  }

  .bar {
    grid-template-rows: auto 110px auto;
  }

  .ladder {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    row-gap: 14px;
  }

  .egg {
    flex-direction: column;
    text-align: center;
  }

  .egg-actions {
    justify-content: center;
  }

  .achievement {
    padding: 14px;
    gap: 12px;
  }
}
</style>
