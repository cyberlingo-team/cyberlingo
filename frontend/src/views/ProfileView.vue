<script setup>
// Mon Tux, à la manière du profil de la copie de référence : le personnage du joueur à son
// stade, ce qui lui manque pour le suivant, ses statistiques, sa semaine, ses succès et le
// carnet des missions du jour. Sans compte, l'œuf attend d'éclore.
import { computed, ref } from 'vue'
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

const stats = computed(() => {
  const m = me.value
  const rate = m.totals.questions ? Math.round((m.totals.correct / m.totals.questions) * 100) : null
  return [
    { id: 'streak', icon: 'flamme', value: m.streak.current, label: m.streak.current > 1 ? 'Jours de série' : 'Jour de série', off: !m.streak.playedToday },
    { id: 'points', icon: 'haltere', value: formatNumber(m.points), label: 'Points au total' },
    { id: 'lessons', icon: 'igloo', value: m.totals.lessons, label: m.totals.lessons > 1 ? 'Leçons réussies' : 'Leçon réussie' },
    { id: 'missions', icon: 'trophee', value: m.totals.episodes, label: m.totals.episodes > 1 ? 'Missions du jour' : 'Mission du jour' },
    { id: 'rate', icon: 'cible', value: rate === null ? '–' : `${rate} %`, label: 'De bonnes réponses' },
    { id: 'rank', icon: 'podium', value: m.rank.week ? `${m.rank.week.position}${m.rank.week.position === 1 ? 're' : 'e'}` : '–', label: 'Place cette semaine' },
  ]
})

const streakLine = computed(() => {
  const streak = me.value.streak
  if (streak.current === 0) return 'Pas de série en cours : la mission du jour en relance une.'
  if (streak.playedToday) return 'Mission du jour faite : ta série est à l’abri jusqu’à demain.'
  return 'Pas encore de mission aujourd’hui : ta série tient jusqu’à minuit.'
})

// La semaine en courbe, comme dans la copie : sept points, le plus haut en haut du cadre.
const week = computed(() =>
  (me.value?.week || []).map((day, i, days) => ({
    ...day,
    short: i === days.length - 1 ? 'Auj.' : formatWeekday(day.date).slice(0, 1).toUpperCase(),
  })),
)
const weekTotal = computed(() => week.value.reduce((sum, day) => sum + day.points, 0))
const weekMax = computed(() => Math.max(20, ...week.value.map((day) => day.points)))
const pointY = (points) => 207 - (points / weekMax.value) * 192

// Les succès : une tuile colorée par succès, comme dans la copie.
const COLORS = ['var(--alert)', 'var(--success)', 'var(--unit-glace)', 'var(--beak)', 'var(--toque-bright)', 'var(--unit-mer)']
const achievements = computed(() => (me.value?.achievements || []).map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] })))
const allAchievements = ref(false)
const detail = ref(null)

function achievementText(item) {
  if (item.level === item.maxLevel) return `Niveau maximum atteint : ${item.value} ${item.unit}.`
  return `Niveau ${item.level} sur ${item.maxLevel}. Prochain palier : ${item.value} / ${item.goal} ${item.unit}.`
}

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
  <AppShell>
    <h1 v-if="!data" class="visually-hidden">Mon Tux</h1>
    <StatePanel v-if="error && !data" state="error" :error="error" :retry="reload" />
    <StatePanel v-else-if="!data" label="Ton Tux arrive…" />

    <!-- Sans compte : l'œuf. -->
    <div v-else-if="!me" class="cl-profile-page">
      <div class="cl-profile-cover">
        <img :src="sceneImage('egg').src" alt="Un œuf coiffé d’une toque, qui commence à se fendre." />
      </div>
      <h1>Ton Tux n’a pas encore éclos</h1>
      <p>Crée un profil : il éclot à ta première leçon, puis chaque bonne réponse lui donne du muscle. Ta série, tes points et ta place au classement sont gardés.</p>
      <div class="profile-actions">
        <RouterLink class="cl-button blue" :to="{ path: '/inscription', query: { redirect: '/mon-tux' } }">Créer un profil</RouterLink>
        <RouterLink class="cl-button" :to="{ path: '/connexion', query: { redirect: '/mon-tux' } }">Se connecter</RouterLink>
      </div>
      <section aria-labelledby="ladder-title">
        <h2 id="ladder-title">Ce qu’il peut devenir</h2>
        <ol class="ladder">
          <li v-for="stage in stages" :key="stage.level" :style="{ '--grow': stage.level }">
            <img :src="stageImage(stage.level, { mini: true }).src" :alt="stage.name" />
            <strong>{{ stage.name }}</strong>
            <small>{{ stage.minPoints ? `${formatNumber(stage.minPoints)} pts` : 'au départ' }}</small>
          </li>
        </ol>
      </section>
      <RouterLink class="cl-mobile-preferences cl-button" to="/preferences">Préférences</RouterLink>
    </div>

    <!-- Tous les succès, comme la page « Succès » de la copie. -->
    <div v-else-if="allAchievements" class="cl-achievements-page">
      <button type="button" class="back" @click="allAchievements = false">← Mon Tux</button>
      <h1>Succès</h1>
      <article v-for="item in achievements" :key="item.id" :class="{ locked: item.level === 0 }">
        <div :style="{ background: item.color }"><Icon :name="item.icon" :size="72" /></div>
        <section>
          <h2>{{ item.title }} <small>Niveau {{ item.level }} / {{ item.maxLevel }}</small></h2>
          <p>{{ achievementText(item) }}</p>
          <div class="cl-quest-progress" role="progressbar" :aria-valuenow="Math.min(item.value, item.goal)" aria-valuemin="0" :aria-valuemax="item.goal" :aria-label="item.title">
            <span :style="{ width: `${Math.min(100, (item.value / item.goal) * 100)}%` }"></span><b>{{ Math.min(item.value, item.goal) }} / {{ item.goal }}</b>
          </div>
        </section>
      </article>
    </div>

    <!-- Avec compte : la fiche du personnage. -->
    <div v-else class="cl-profile-page">
      <div class="cl-profile-cover tux-cover">
        <img :src="stageImage(me.stage.level).src" :alt="`Le Tux de ${me.user.username}, au stade ${me.stage.name}.`" />
        <RouterLink class="cl-profile-edit" to="/mon-compte" aria-label="Modifier mon compte">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" /></svg>
        </RouterLink>
      </div>
      <h1>{{ me.user.username }}</h1>
      <p class="cl-profile-username">Stade {{ me.stage.level }} / {{ lastLevel }} · {{ me.stage.name }}</p>
      <p>Sur la banquise depuis le {{ formatFullDate(me.user.createdAt) }}</p>
      <p class="motto">« {{ typo(me.stage.motto) }} »</p>

      <div v-if="next" class="gauge">
        <p><strong>{{ plural(remaining, 'point') }}</strong> avant <strong>{{ next.name }}</strong></p>
        <div class="cl-quest-progress" role="progressbar" :aria-valuenow="me.points" :aria-valuemin="me.stage.minPoints" :aria-valuemax="next.minPoints" :aria-label="`Points jusqu’au stade ${next.name}`">
          <span :style="{ width: `${progress}%` }"></span><b>{{ formatNumber(me.points) }} / {{ formatNumber(next.minPoints) }}</b>
        </div>
      </div>
      <p v-else class="gauge">Dernier stade atteint. Les arnaques n’ont qu’à bien se tenir.</p>

      <section aria-labelledby="stats-title">
        <h2 id="stats-title">Statistiques</h2>
        <div class="cl-profile-stats">
          <div v-for="stat in stats" :key="stat.id" :class="{ off: stat.off }">
            <Icon :name="stat.icon" :size="28" />
            <span><strong>{{ stat.value }}</strong><small>{{ stat.label }}</small></span>
          </div>
        </div>
        <p class="streak-line">{{ streakLine }}<template v-if="me.streak.best > 1"> Record : {{ plural(me.streak.best, 'jour') }}.</template></p>
      </section>

      <section aria-labelledby="week-title">
        <h2 id="week-title">Points gagnés cette semaine</h2>
        <div class="cl-chart">
          <strong>{{ me.user.username }} <span>{{ plural(weekTotal, 'point') }}</span></strong>
          <svg viewBox="0 0 548 265" role="img" :aria-label="`Tes points sur sept jours : ${week.map((day) => `${formatDay(day.date)}, ${day.points}`).join(' ; ')}`">
            <g v-for="i in 5" :key="i">
              <line x1="42" :y1="15 + (i - 1) * 48" x2="530" :y2="15 + (i - 1) * 48" class="chart-grid" />
              <text x="16" :y="20 + (i - 1) * 48" class="chart-label">{{ Math.round((weekMax * (5 - i)) / 4) }}</text>
            </g>
            <polyline :points="week.map((day, i) => `${42 + i * 80},${pointY(day.points)}`).join(' ')" class="chart-line" />
            <g v-for="(day, i) in week" :key="day.date">
              <circle :cx="42 + i * 80" :cy="pointY(day.points)" r="5" class="chart-dot" />
              <text :x="42 + i * 80" y="244" text-anchor="middle" class="chart-label">{{ day.short }}</text>
            </g>
          </svg>
        </div>
      </section>

      <section aria-labelledby="achievements-title">
        <div class="cl-panel-heading">
          <h2 id="achievements-title">Succès</h2>
          <button type="button" class="see-all" @click="allAchievements = true">Afficher tout</button>
        </div>
        <div class="cl-achievement-row">
          <button v-for="item in achievements" :key="item.id" type="button" :class="{ locked: item.level === 0 }" :style="{ background: item.color }" @click="detail = item">
            <Icon :name="item.icon" :size="56" />
            <strong>Niveau {{ item.level }}</strong>
            <span class="visually-hidden">{{ item.title }}</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="calendar-title">
        <h2 id="calendar-title">Le carnet des missions du jour</h2>
        <div class="cl-chart">
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

      <section aria-labelledby="ladder-title">
        <h2 id="ladder-title">Les stades du Tux</h2>
        <ol class="ladder">
          <li v-for="stage in stages" :key="stage.level" :class="{ current: stage.level === me.stage.level, locked: stage.level > me.stage.level }" :style="{ '--grow': stage.level }">
            <img :src="stageImage(stage.level, { mini: true }).src" :alt="stage.level > me.stage.level ? 'Stade pas encore atteint' : stage.name" />
            <strong>{{ stage.level > me.stage.level ? '?' : stage.name }}</strong>
            <small>{{ stage.minPoints ? `${formatNumber(stage.minPoints)} pts` : 'au départ' }}</small>
          </li>
        </ol>
      </section>

      <RouterLink class="cl-mobile-preferences cl-button" to="/preferences">Préférences</RouterLink>
      <RouterLink class="cl-mobile-preferences cl-button" to="/mon-compte">Mon compte</RouterLink>
    </div>

    <div v-if="detail" class="cl-modal-backdrop" @click.self="detail = null">
      <section class="cl-dialog" role="dialog" aria-modal="true" :aria-label="detail.title">
        <Icon :name="detail.icon" :size="80" class="dialog-icon" />
        <h2>{{ detail.title }}</h2>
        <p>{{ achievementText(detail) }}</p>
        <button type="button" class="cl-button blue" @click="detail = null">Compris</button>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.cl-profile-cover {
  display: flex;
  justify-content: center;
  background: var(--toque-pale);
}

.cl-profile-cover > img {
  width: auto;
  height: 100%;
  padding-top: 16px;
  object-fit: contain;
  object-position: bottom;
}

.cl-profile-edit {
  display: grid;
  place-items: center;
}

.cl-profile-edit svg {
  width: 24px;
  height: 24px;
}

.cl-profile-page > h1 {
  overflow-wrap: anywhere;
}

.motto {
  margin-top: 8px;
  font-style: italic;
}

.gauge {
  display: grid;
  gap: 8px;
  margin: 20px 0 8px;
  color: var(--muted);
}

.gauge strong {
  color: var(--ink);
}

.gauge .cl-quest-progress > span {
  background: var(--beak);
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0 8px;
}

.cl-profile-stats > div.off :deep(.icon) {
  filter: grayscale(1);
  opacity: 0.55;
}

.cl-profile-stats strong {
  color: var(--ink);
}

.streak-line {
  margin-top: 12px;
  color: var(--muted);
}

.chart-grid {
  stroke: var(--rule);
  stroke-width: 2;
}

.chart-label {
  fill: #9aa0b4;
  font-size: 15px;
  font-weight: 700;
}

.chart-line {
  fill: none;
  stroke: var(--toque-bright);
  stroke-width: 3;
}

.chart-dot {
  fill: var(--toque-bright);
}

.cl-chart > strong span {
  color: var(--muted);
}

.cl-panel-heading h2 {
  margin-bottom: 12px;
}

.cl-app .see-all {
  padding: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--toque-bright);
  background: none;
  border: 0;
}

.cl-achievement-row {
  flex-wrap: wrap;
}

.cl-app .cl-achievement-row button {
  display: grid;
  justify-items: center;
  gap: 4px;
  flex: 1 1 72px;
  padding: 10px 4px 8px;
}

.cl-achievement-row :deep(.icon) {
  width: 56px;
  height: 56px;
}

.cl-achievement-row button.locked,
.cl-achievements-page article.locked > div {
  filter: grayscale(1);
  opacity: 0.6;
}

.cl-achievements-page > article > div {
  display: grid;
  place-items: center;
}

.cl-achievements-page h2 small {
  margin-left: 8px;
  font-size: 15px;
  color: #9aa0b4;
}

.cl-app .back {
  padding: 0;
  margin-top: 8px;
  font-weight: 700;
  color: var(--ink);
  background: none;
  border: 0;
}

.dialog-icon {
  margin: 0 auto;
}

/* Le carnet des missions du jour. */
.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  max-width: 420px;
  margin: 0 auto;
}

.calendar-head {
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: #9aa0b4;
}

.calendar-day {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  font-size: 14px;
  font-weight: 700;
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
  border: 2px solid var(--toque-bright);
}

.legend {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 16px;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--muted);
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
  border: 1px solid var(--alert);
}

.dot.is-today {
  border: 2px solid var(--toque-bright);
}

/* Les stades : le Tux grandit d'un stade à l'autre. */
.ladder {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 20px 12px;
  overflow-x: auto;
  list-style: none;
  border: 2px solid var(--rule);
  border-radius: 16px;
}

.ladder li {
  display: grid;
  flex: 1 0 64px;
  justify-items: center;
  gap: 2px;
  padding: 6px 2px;
  text-align: center;
  border-radius: 12px;
}

.ladder li.current {
  background: var(--toque-pale);
}

.ladder img {
  width: calc(32px + var(--grow) * 5px);
  height: auto;
}

.ladder li.locked img {
  filter: brightness(0) opacity(0.15);
}

.ladder strong {
  font-size: 13px;
}

.ladder small {
  font-size: 12px;
  color: #9aa0b4;
}

.cl-profile-page > .cl-mobile-preferences {
  margin-top: 16px;
}

/* Sur téléphone, tous les succès et tous les stades restent visibles, sans défilement caché. */
@media (max-width: 699px) {
  .cl-achievement-row {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 6px;
    padding: 12px 8px;
  }

  .cl-app .cl-achievement-row button {
    min-width: 0 !important;
  }

  .cl-achievement-row :deep(.icon) {
    width: 40px;
    height: 40px;
  }

  .cl-achievement-row strong {
    font-size: 10px;
  }

  .ladder {
    flex-wrap: wrap;
    row-gap: 12px;
  }

  .ladder li {
    flex: 1 0 22%;
  }
}
</style>
