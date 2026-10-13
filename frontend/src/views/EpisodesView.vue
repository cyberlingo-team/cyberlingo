<script setup>
// Tous les épisodes parus, rangés par semaine comme des numéros de BD sur une étagère. Ceux qu'on
// a joués portent leur score et Léopold démasqué ; les autres se rattrapent.
import { computed, ref } from 'vue'
import LoadingPanel from '../components/comic/LoadingPanel.vue'
import ErrorPanel from '../components/comic/ErrorPanel.vue'
import Picture from '../components/comic/Picture.vue'
import Stamp from '../components/comic/Stamp.vue'
import { listMissions } from '../api/index.js'
import { loadSession, session } from '../lib/session.js'
import { useResource } from '../lib/resource.js'
import { gangImage, villainImage } from '../lib/images.js'
import { addDaysIso, formatDay, formatShortDay, parseDate, plural, toIsoDate, todayIso, typo } from '../lib/format.js'

const { data, error, reload } = useResource(async () => {
  const [result] = await Promise.all([listMissions(), loadSession()])
  return result
})

const episodes = computed(() => data.value?.episodes || [])
const signedIn = computed(() => Boolean(session.user))
const playedCount = computed(() => episodes.value.filter((e) => e.status === 'played').length)
const toCatchUp = computed(() => episodes.value.filter((e) => ['missed', 'started', 'unplayed'].includes(e.status)))
const launch = computed(() => episodes.value.at(-1)?.date)

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'catch-up', label: 'À rattraper' },
  { id: 'done', label: 'Joués' },
]
const filter = ref('all')

function matches(episode) {
  if (filter.value === 'catch-up') return ['missed', 'started', 'unplayed'].includes(episode.status)
  if (filter.value === 'done') return episode.status === 'played' || episode.status === 'practiced'
  return true
}

function countFor(id) {
  if (id === 'catch-up') return toCatchUp.value.length
  if (id === 'done') return episodes.value.filter((e) => e.status === 'played' || e.status === 'practiced').length
  return episodes.value.length
}

function weekStart(isoDate) {
  const date = parseDate(isoDate)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return toIsoDate(date)
}

function weekLabel(start) {
  const thisWeek = weekStart(todayIso())
  if (start === thisWeek) return 'Cette semaine'
  if (start === addDaysIso(thisWeek, -7)) return 'La semaine dernière'
  return `Semaine du ${formatDay(start).replace(/^\S+ /, '')}`
}

const weeks = computed(() => {
  const groups = []
  for (const episode of episodes.value.filter(matches)) {
    const start = weekStart(episode.date)
    let group = groups.at(-1)
    if (!group || group.start !== start) {
      group = { start, label: weekLabel(start), episodes: [] }
      groups.push(group)
    }
    group.episodes.push(episode)
  }
  return groups
})

function linkFor(episode) {
  return episode.status === 'today' || episode.date === todayIso() ? '/' : `/episode/${episode.date}`
}

const STATUS_TEXT = {
  today: 'Aujourd’hui',
  started: 'Commencé',
  missed: 'Manqué',
}

function statusText(episode) {
  if (episode.status === 'played') return `Joué : ${episode.score.correct} sur ${episode.score.total}`
  if (episode.status === 'practiced') return `Rattrapé : ${episode.score.correct} sur ${episode.score.total}`
  return STATUS_TEXT[episode.status] || ''
}
</script>

<template>
  <div class="page page--wide shelf">
    <h1 class="page-title">Les épisodes</h1>

    <ErrorPanel v-if="error && !data" :error="error" :retry="reload" />
    <LoadingPanel v-else-if="!data" label="Chargement des épisodes" />

    <template v-else>
      <p v-if="signedIn" class="lead">
        Tu en as joué {{ playedCount }} sur {{ episodes.length }}.
        <template v-if="toCatchUp.length">
          Ceux qui te manquent se rattrapent ici : même correction, mais sans points.
        </template>
        <template v-else>Tu n’en as manqué aucun.</template>
      </p>
      <p v-else class="lead">
        {{ plural(episodes.length, 'épisode') }} parus depuis le {{ formatDay(launch).replace(/^\S+ /, '') }}. Lis-les
        dans l’ordre que tu veux : chacun se suffit à lui-même.
      </p>

      <div v-if="signedIn" class="filters" role="group" aria-label="Afficher">
        <button
          v-for="item in FILTERS"
          :key="item.id"
          type="button"
          class="filter"
          :aria-pressed="filter === item.id"
          @click="filter = item.id"
        >
          {{ item.label }} <span class="filter-count">{{ countFor(item.id) }}</span>
        </button>
      </div>

      <p v-if="!weeks.length" class="caption empty">
        {{ filter === 'catch-up' ? 'Rien à rattraper : tu as joué tous les épisodes parus. Le prochain sort à minuit.' : 'Tu n’as encore joué aucun épisode. Celui du jour t’attend.' }}
      </p>

      <section v-for="week in weeks" :key="week.start" class="week" :aria-labelledby="`week-${week.start}`">
        <h2 :id="`week-${week.start}`" class="week-title">{{ week.label }}</h2>
        <ul class="covers">
          <li v-for="episode in week.episodes" :key="episode.date" class="covers-item">
            <RouterLink :to="linkFor(episode)" class="mini" :class="`mini--${episode.status}`">
              <span class="mini-head">
                <span class="mini-number">
                  <span class="visually-hidden">Épisode </span><span aria-hidden="true">N<sup>o</sup>&nbsp;</span>{{ episode.number }}
                </span>
                <span class="mini-date">{{ formatShortDay(episode.date) }}</span>
              </span>
              <span class="mini-title">{{ typo(episode.title) }}</span>
              <span class="mini-theme">{{ episode.theme }}</span>
              <span class="mini-art" aria-hidden="true">
                <Picture class="mini-guest" :image="gangImage(episode.guest.id)" />
                <Picture
                  v-if="episode.villain"
                  class="mini-villain"
                  :image="villainImage(episode.villain.id)"
                />
              </span>
              <span v-if="statusText(episode)" class="mini-status">
                <Stamp
                  :tone="episode.status === 'today' ? 'alert' : episode.status === 'played' ? 'safe' : 'ink'"
                  class="mini-stamp"
                >
                  {{ statusText(episode) }}
                </Stamp>
                <span v-if="episode.status === 'played'" class="mini-points">+{{ plural(episode.score.points, 'point') }}</span>
              </span>
              <span v-if="episode.villain" class="visually-hidden">Léopold démasqué {{ episode.villain.disguise }}.</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter {
  min-height: 42px;
  padding: 0.3em 0.9em;
  font-family: var(--font-title);
  font-weight: 700;
  background: var(--paper);
  border: 2px solid var(--ink);
}

.filter[aria-pressed='true'] {
  background: var(--ink);
  color: var(--paper);
}

.filter-count {
  font-weight: 500;
  opacity: 0.8;
}

.empty {
  justify-self: start;
}

.week {
  display: grid;
  gap: 10px;
}

.week-title {
  font-size: 1.25rem;
  font-weight: 800;
  font-stretch: 104%;
}

.covers {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: 12px;
}

@media (max-width: 520px) {
  .covers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
}

.covers-item {
  display: flex;
}

/* Un numéro en miniature : bandeau noir, titre, invité, tampon. */
.mini {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-rows: auto auto auto 1fr auto;
  min-height: 250px;
  color: var(--ink);
  text-decoration: none;
  background: var(--paper);
  border: var(--line) solid var(--ink);
  overflow: hidden;
  transition: transform 0.12s;
}

.mini:hover {
  transform: rotate(-1deg) translateY(-2px);
}

.mini:hover .mini-title {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

.mini-head {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 8px;
  font-family: var(--font-title);
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--paper);
  background: var(--ink);
}

/* L'abréviation de « numéro » prend un o en exposant : le signe ° est celui des degrés. */
.mini-number sup {
  font-size: 0.66em;
  line-height: 0;
  vertical-align: 0.42em;
}

.mini-date {
  font-weight: 500;
}

.mini-title {
  padding: 8px 10px 0;
  font-family: var(--font-title);
  font-weight: 880;
  font-stretch: 108%;
  font-size: 1.12rem;
  line-height: 1.02;
  text-wrap: balance;
}

.mini-theme {
  padding: 2px 10px 0;
  font-size: 0.82rem;
  color: var(--muted);
}

.mini-art {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 92px;
  padding: 6px 10px 0;
  background-image: radial-gradient(var(--caption) 2.6px, transparent 3px);
  background-size: 9px 9px;
  background-position: center;
}

.mini-guest {
  width: auto;
  max-height: 96px;
  max-width: 70%;
  object-fit: contain;
}

.mini-villain {
  position: absolute;
  right: 6px;
  bottom: 0;
  width: auto;
  height: 74px;
  object-fit: contain;
}

.mini-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  padding: 8px 10px 10px;
  border-top: 2px solid var(--ink);
}

.mini-stamp {
  font-size: 0.8rem;
}

.mini-points {
  font-family: var(--font-title);
  font-weight: 750;
  font-size: 0.86rem;
  color: var(--beak);
}

.mini--today {
  border-color: var(--alert);
  box-shadow: 5px 5px 0 var(--alert);
}

.mini--missed .mini-art,
.mini--unplayed .mini-art {
  background-image: radial-gradient(var(--dots) 2.6px, transparent 3px);
}

.mini--missed .mini-guest {
  opacity: 0.75;
}
</style>
