<script setup>
// Le classement, à la manière des ligues de la copie de référence : sur les sept derniers jours
// ou depuis le début, chaque joueur avec le Tux de son stade. Le joueur connecté voit sa place
// et qui il peut dépasser ; à droite, ce qu'est le classement.
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
    <div class="board">
      <Icon name="podium" :size="110" class="board-badge" />
      <h1>Classement</h1>
      <p v-if="board" class="board-span">{{ span }} · {{ plural(board.players, 'joueur classé', 'joueurs classés') }}</p>

      <nav class="periods" aria-label="Période du classement">
        <RouterLink
          v-for="item in PERIODS"
          :key="item.id"
          :to="{ path: '/classement', query: item.query ? { periode: item.query } : {} }"
          class="period"
          :class="{ active: period === item.id }"
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
        <p v-if="me" class="standing">
          Tu es <strong>{{ ordinal(me.rank) }}</strong> avec {{ plural(me.points, 'point') }}
          {{ board.period === 'week' ? 'ces 7 derniers jours' : 'depuis ton arrivée' }}.
          <template v-if="me.ahead">
            Encore {{ plural(me.ahead.gap, 'point') }} pour dépasser <strong>{{ me.ahead.username }}</strong>.
            <template v-if="nextToday"><RouterLink to="/mission-du-jour">La mission du jour</RouterLink> peut t’en rapporter jusqu’à {{ me.next.maxPoints }}.</template>
          </template>
          <template v-else> Personne devant toi : reviens demain pour garder ta place !</template>
        </p>
        <p v-else-if="session.user" class="standing">
          {{ board.period === 'week' ? 'Pas encore de points ces 7 derniers jours.' : 'Pas encore de points.' }}
          Une leçon suffit pour entrer au classement.
        </p>
        <template v-else>
          <p class="standing">Ton nom n’est pas encore dans la liste : crée un profil, et chaque leçon te fait grimper.</p>
          <RouterLink class="cl-button blue" :to="{ path: '/inscription', query: { redirect: '/classement' } }">Créer un profil</RouterLink>
        </template>
        <RouterLink v-if="session.user && !me" class="cl-button" to="/apprendre">Commencer une leçon</RouterLink>

        <p v-if="!board.players" class="standing">Personne n’a encore marqué de points sur cette période. Le premier qui joue prend la tête !</p>

        <template v-else>
          <ol class="cl-ranking" :aria-label="`Classement : ${span}`">
            <li v-for="row in board.top" :key="`top-${row.rank}-${row.username}`" :class="{ self: row.me }">
              <span :class="row.rank <= 3 ? `medal medal--${row.rank}` : ''">{{ row.rank }}<span class="visually-hidden">{{ row.rank === 1 ? 're' : 'e' }} place</span></span>
              <img :src="stageImage(row.level, { mini: true }).src" alt="" class="row-tux" />
              <strong>
                {{ row.username }}<template v-if="row.me"> (toi)</template>
                <small v-if="row.streak"><Icon name="flamme" :size="16" />{{ plural(row.streak, 'jour') }}</small>
              </strong>
              <em>{{ formatNumber(row.points) }} pts</em>
            </li>
          </ol>
          <template v-if="board.around.length">
            <p class="gap" aria-hidden="true">•••</p>
            <ol class="cl-ranking around" aria-label="Autour de toi">
              <li v-for="row in board.around" :key="`around-${row.rank}-${row.username}`" :class="{ self: row.me }">
                <span>{{ row.rank }}<span class="visually-hidden">e place</span></span>
                <img :src="stageImage(row.level, { mini: true }).src" alt="" class="row-tux" />
                <strong>
                  {{ row.username }}<template v-if="row.me"> (toi)</template>
                  <small v-if="row.streak"><Icon name="flamme" :size="16" />{{ plural(row.streak, 'jour') }}</small>
                </strong>
                <em>{{ formatNumber(row.points) }} pts</em>
              </li>
            </ol>
          </template>
        </template>
      </template>
    </div>

    <template #aside>
      <section class="cl-panel cl-league-explanation">
        <h3>Le classement, c’est quoi ?</h3>
        <h2>Fais la mission du jour. Gagne des points. Grimpe au classement.</h2>
        <p>Chaque leçon et chaque mission du jour te rapportent des points : ceux des sept derniers jours font le classement de la semaine.</p>
      </section>
    </template>
  </AppShell>
</template>

<style scoped>
.board {
  display: grid;
  justify-items: center;
  text-align: center;
  padding-top: 8px;
}

.board-badge {
  margin-bottom: 12px;
}

.board-span {
  margin-top: 8px;
  color: var(--muted);
}

.periods {
  display: flex;
  gap: 8px;
  margin: 24px 0 8px;
}

.cl-app .period {
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #9aa0b4;
  border: 2px solid var(--rule);
  border-radius: 12px;
}

.cl-app .period.active {
  color: var(--toque-bright);
  background: var(--toque-pale);
  border-color: var(--toque-line);
}

.standing {
  max-width: 460px;
  margin: 16px auto 20px;
  font-size: 17px;
  line-height: 26px;
  color: var(--muted);
}

.standing strong {
  color: var(--ink);
}

.standing a {
  font-weight: 700;
  color: var(--toque-bright);
}

.board > .cl-button {
  min-width: 260px;
  margin-bottom: 8px;
}

.cl-ranking {
  width: 100%;
  margin-top: 16px !important;
}

.cl-ranking li > span {
  width: 28px;
  flex-shrink: 0;
  text-align: center;
  color: var(--muted);
}

.cl-ranking .medal {
  display: grid;
  place-items: center;
  height: 28px;
  color: #fff;
  border-radius: 50%;
}

.medal--1 {
  background: #e9b200;
}

.medal--2 {
  background: #a3abbd;
}

.medal--3 {
  background: #c97a3d;
}

.row-tux {
  width: 44px;
  height: 48px;
  flex-shrink: 0;
  object-fit: contain;
}

.cl-ranking strong {
  display: grid;
  min-width: 0;
  overflow-wrap: anywhere;
}

.cl-ranking small {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--beak-ink);
}

.cl-ranking em {
  flex-shrink: 0;
  font-weight: 700;
}

.gap {
  margin: 4px 0;
  color: #9aa0b4;
  letter-spacing: 4px;
}

.around {
  margin-top: 0 !important;
}

/* L'explication passe dans la colonne de droite : elle reprend la carte de la copie. */
.cl-league-explanation {
  position: static;
  width: auto;
}

@media (max-width: 699px) {
  .cl-ranking li {
    gap: 12px;
    padding: 12px 8px;
  }
}
</style>
