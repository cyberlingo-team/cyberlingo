<script setup>
// Le classement, sur les sept derniers jours ou depuis le début. Chaque joueur avec le Tux de
// son stade ; le joueur connecté voit sa place et qui il peut dépasser.
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { getLeaderboard } from '../api/index.js'
import { loadSession, session } from '../lib/session.js'
import { useResource } from '../lib/resource.js'
import { stageImage } from '../lib/images.js'
import { formatDay, formatNumber, plural } from '../lib/format.js'

const route = useRoute()

const PERIODS = [
  { id: 'week', query: undefined, label: 'Cette semaine' },
  { id: 'all', query: 'tout', label: 'Depuis le début' },
]

const period = computed(() => (route.query.periode === 'tout' ? 'all' : 'week'))

const { data, error, reload } = useResource(async () => {
  const [board] = await Promise.all([getLeaderboard(period.value), loadSession()])
  return board
})

watch(period, reload)

const board = computed(() => (data.value && data.value.period === period.value ? data.value : null))
const me = computed(() => board.value?.me || null)

const ordinal = (rank) => `${rank}${rank === 1 ? 're' : 'e'}`

// « Du 16 au 22 octobre », ou « Du 30 septembre au 6 octobre » à cheval sur deux mois.
const span = computed(() => {
  if (!board.value) return ''
  const from = formatDay(board.value.from).replace(/^\S+ /, '')
  const to = formatDay(board.value.to).replace(/^\S+ /, '')
  if (board.value.period !== 'week') return `Depuis le lancement, le ${from}`
  const sameMonth = from.split(' ')[1] === to.split(' ')[1]
  return `Du ${sameMonth ? from.split(' ')[0] : from} au ${to}`
})

// La mission du jour rapporte-t-elle encore des points aujourd'hui ?
const nextToday = computed(() => me.value?.next && board.value && me.value.next.date === board.value.to)
</script>

<template>
  <AppShell>
    <div class="board-page">
      <header class="banner">
        <Icon name="podium" :size="88" />
        <div class="banner-text">
          <h1 class="banner-title">Classement</h1>
          <p v-if="board" class="banner-sub">{{ span }} · {{ plural(board.players, 'joueur classé', 'joueurs classés') }}</p>
          <p v-else class="banner-sub">Les points de la mission du jour et du chemin.</p>
        </div>
      </header>

      <nav class="periods" aria-label="Période du classement">
        <RouterLink
          v-for="item in PERIODS"
          :key="item.id"
          :to="{ path: '/classement', query: item.query ? { periode: item.query } : {} }"
          class="period"
          :class="{ 'is-active': period === item.id }"
          :aria-current="period === item.id ? 'page' : undefined"
          replace
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <StatePanel v-if="error && !board" state="error" :error="error" :retry="reload" />
      <StatePanel v-else-if="!board" label="Chargement du classement…" />

      <template v-else>
        <!-- Où j'en suis, et qui je peux dépasser. -->
        <section v-if="me" class="standing card card--pad" aria-label="Ta place">
          <p class="standing-rank">
            <span class="standing-number">{{ ordinal(me.rank) }}</span>
            <span class="standing-of">sur {{ formatNumber(board.players) }}</span>
          </p>
          <div class="standing-text">
            <p>
              <strong>{{ plural(me.points, 'point') }}</strong>
              {{ board.period === 'week' ? 'ces 7 derniers jours' : 'depuis ton arrivée' }}.
            </p>
            <p v-if="me.ahead" class="muted">
              Encore {{ plural(me.ahead.gap, 'point') }} pour dépasser <strong class="rival">{{ me.ahead.username }}</strong> ({{ ordinal(me.ahead.rank) }}).
              <template v-if="nextToday">
                <RouterLink to="/mission-du-jour">La mission du jour</RouterLink> peut t’en rapporter jusqu’à {{ me.next.maxPoints }}.
              </template>
            </p>
            <p v-else class="muted">Personne devant toi. Reviens demain pour garder ta place !</p>
          </div>
        </section>

        <p v-else-if="session.user" class="card card--pad none">
          {{ board.period === 'week' ? 'Pas encore de points ces 7 derniers jours.' : 'Pas encore de points.' }}
          Une leçon suffit pour entrer au classement : <RouterLink to="/apprendre">à toi de jouer</RouterLink>.
        </p>

        <section v-else class="guest card card--pad">
          <p class="guest-title">Ton nom n’est pas encore dans la liste</p>
          <p class="muted">Crée un profil : chaque leçon et chaque mission du jour te font grimper au classement.</p>
          <div class="guest-actions">
            <RouterLink class="button" :to="{ path: '/inscription', query: { redirect: '/classement' } }">Créer un profil</RouterLink>
            <RouterLink class="button button--ghost" :to="{ path: '/connexion', query: { redirect: '/classement' } }">Se connecter</RouterLink>
          </div>
        </section>

        <p v-if="!board.players" class="card card--pad none">
          Personne n’a encore marqué de points sur cette période. Le premier qui joue prend la tête !
        </p>

        <section v-else class="list card" :aria-label="`Classement : ${span}`">
          <ol class="rows">
            <li v-for="row in board.top" :key="`top-${row.rank}-${row.username}`" class="row" :class="{ 'is-me': row.me }">
              <span class="rank" :class="row.rank <= 3 ? `rank--${row.rank}` : ''">
                {{ row.rank }}<span class="visually-hidden">{{ row.rank === 1 ? 're' : 'e' }} place</span>
              </span>
              <img :src="stageImage(row.level, { mini: true }).src" alt="" class="row-tux" />
              <span class="row-name">
                <span class="row-user">{{ row.username }}<span v-if="row.me" class="row-you"> (toi)</span></span>
                <span v-if="row.streak" class="row-streak"><Icon name="flamme" :size="16" />{{ plural(row.streak, 'jour') }}</span>
              </span>
              <span class="row-points">{{ formatNumber(row.points) }}<span class="row-unit"> pts</span></span>
            </li>
          </ol>

          <template v-if="board.around.length">
            <p class="gap" aria-hidden="true"><span></span><span></span><span></span></p>
            <ol class="rows" aria-label="Autour de toi">
              <li v-for="row in board.around" :key="`around-${row.rank}-${row.username}`" class="row" :class="{ 'is-me': row.me }">
                <span class="rank">{{ row.rank }}<span class="visually-hidden">e place</span></span>
                <img :src="stageImage(row.level, { mini: true }).src" alt="" class="row-tux" />
                <span class="row-name">
                  <span class="row-user">{{ row.username }}<span v-if="row.me" class="row-you"> (toi)</span></span>
                  <span v-if="row.streak" class="row-streak"><Icon name="flamme" :size="16" />{{ plural(row.streak, 'jour') }}</span>
                </span>
                <span class="row-points">{{ formatNumber(row.points) }}<span class="row-unit"> pts</span></span>
              </li>
            </ol>
          </template>
        </section>
      </template>
    </div>
  </AppShell>
</template>

<style scoped>
.board-page {
  display: grid;
  gap: 20px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 22px;
  color: #fff;
  background: var(--toque);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--toque-deep);
}

.banner-text {
  display: grid;
  gap: 4px;
}

.banner-title {
  font-size: 1.7rem;
}

.banner-sub {
  color: #dfe3ff;
}

/* Les deux onglets de période. */
.periods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 4px;
  background: var(--wash);
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.period {
  padding: 10px 12px;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: var(--muted);
  border-radius: var(--radius-small);
}

.period:hover {
  text-decoration: none;
  color: var(--ink);
}

.period.is-active {
  color: var(--toque-bright);
  background: var(--paper);
  box-shadow: 0 2px 0 var(--rule-strong);
}

/* Ta place. */
.standing {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--toque-pale);
  border-color: var(--toque-line);
}

.standing-rank {
  display: grid;
  justify-items: center;
  flex-shrink: 0;
  min-width: 84px;
}

.standing-number {
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1;
  color: var(--toque);
}

.standing-of {
  font-size: 0.85rem;
  color: var(--muted);
}

.standing-text {
  display: grid;
  gap: 4px;
}

.rival {
  color: var(--ink);
}

.none {
  color: var(--muted);
}

.guest {
  display: grid;
  gap: 8px;
}

.guest-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--toque);
}

.guest-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

/* La liste, façon ligue. */
.list {
  padding: 8px;
}

.rows {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 40px 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-small);
}

.row + .row {
  border-top: 2px solid var(--wash);
}

.row.is-me {
  background: var(--toque-pale);
  border-top-color: transparent;
}

.row.is-me + .row {
  border-top-color: transparent;
}

.rank {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-weight: 900;
  color: var(--muted);
}

.rank--1,
.rank--2,
.rank--3 {
  color: #fff;
  border-radius: 50%;
}

.rank--1 {
  background: #f5b700;
  box-shadow: 0 3px 0 #c58f00;
}

.rank--2 {
  background: #a6aec2;
  box-shadow: 0 3px 0 #7f879c;
}

.rank--3 {
  background: #d9823b;
  box-shadow: 0 3px 0 #a85f22;
}

.row-tux {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.row-name {
  display: grid;
  min-width: 0;
}

.row-user {
  overflow: hidden;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-me .row-user {
  color: var(--toque-bright);
}

.row-you {
  font-weight: 700;
}

.row-streak {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: var(--muted);
}

.row-points {
  font-weight: 800;
  white-space: nowrap;
}

.row-unit {
  font-size: 0.85rem;
  color: var(--muted);
}

.gap {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
}

.gap span {
  width: 6px;
  height: 6px;
  background: var(--rule-strong);
  border-radius: 50%;
}

@media (max-width: 520px) {
  .banner {
    gap: 14px;
    padding: 14px 16px;
  }

  .banner :deep(.icon) {
    width: 60px !important;
    height: 60px !important;
  }

  .banner-title {
    font-size: 1.4rem;
  }

  .standing {
    gap: 12px;
  }

  .standing-rank {
    min-width: 64px;
  }

  .row {
    grid-template-columns: 34px 40px minmax(0, 1fr) auto;
    gap: 8px;
    padding: 8px 6px;
  }

  .row-tux {
    width: 38px;
    height: 38px;
  }
}
</style>
