<script setup>
// Le classement, sur les sept derniers jours ou depuis le début. Chaque pseudo s'écrit avec les
// muscles de son Tux. Le joueur connecté voit sa place et qui il peut doubler.
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import LoadingPanel from '../components/comic/LoadingPanel.vue'
import ErrorPanel from '../components/comic/ErrorPanel.vue'
import Picture from '../components/comic/Picture.vue'
import MuscleName from '../components/tux/MuscleName.vue'
import { getGame, getLeaderboard } from '../api/index.js'
import { loadSession, session } from '../lib/session.js'
import { useResource } from '../lib/resource.js'
import { sceneImage, stageImage } from '../lib/images.js'
import { formatDay, formatNumber, ordinal, plural } from '../lib/format.js'

const route = useRoute()

const PERIODS = [
  { id: 'week', query: undefined, label: '7 derniers jours' },
  { id: 'all', query: 'tout', label: 'Depuis le début' },
]

const period = computed(() => (route.query.periode === 'tout' ? 'all' : 'week'))

const { data, error, reload } = useResource(async () => {
  const [board] = await Promise.all([getLeaderboard(period.value), loadSession()])
  return board
})

// Le barème, rappelé sous le tableau. S'il ne vient pas, le tableau s'en passe.
const { data: game } = useResource(getGame)
const scoring = computed(() => game.value?.scoring || null)

watch(period, reload)

const board = computed(() => (data.value && data.value.period === period.value ? data.value : null))
const me = computed(() => board.value?.me || null)
const signedIn = computed(() => Boolean(session.user))

const rows = computed(() => {
  if (!board.value) return []
  const list = board.value.top.map((row) => ({ ...row, key: `top-${row.rank}-${row.username}` }))
  if (board.value.around.length) {
    list.push({ gap: true, key: 'gap' })
    list.push(...board.value.around.map((row) => ({ ...row, key: `around-${row.rank}-${row.username}` })))
  }
  return list
})

// « Du 7 au 13 octobre », ou « Du 30 septembre au 6 octobre » à cheval sur deux mois.
const span = computed(() => {
  if (!board.value) return ''
  const from = formatDay(board.value.from).replace(/^\S+ /, '')
  const to = formatDay(board.value.to).replace(/^\S+ /, '')
  if (board.value.period !== 'week') return `Depuis le lancement, le ${from}`
  const sameMonth = from.split(' ')[1] === to.split(' ')[1]
  return `Du ${sameMonth ? from.split(' ')[0] : from} au ${to}`
})
</script>

<template>
  <div class="page board-page">
    <h1 class="page-title">Classement</h1>

    <nav class="periods" aria-label="Période du classement">
      <RouterLink
        v-for="item in PERIODS"
        :key="item.id"
        :to="{ path: '/classement', query: item.query ? { periode: item.query } : {} }"
        class="period"
        :aria-current="period === item.id ? 'page' : undefined"
        replace
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <ErrorPanel v-if="error && !board" :error="error" :retry="reload" />
    <LoadingPanel v-else-if="!board" label="Chargement du classement" />

    <template v-else>
      <!-- Où j'en suis, et la raison de revenir demain. -->
      <section v-if="me" class="standing panel" aria-label="Ta place">
        <Picture class="standing-tux" :image="stageImage(me.level, { mini: true })" alt="" />
        <div class="standing-text">
          <p class="standing-rank">
            <span class="standing-number">{{ ordinal(me.rank) }}</span>
            <span class="standing-of">sur {{ formatNumber(board.players) }}</span>
          </p>
          <p>
            <strong>{{ plural(me.points, 'point') }}</strong>
            {{ board.period === 'week' ? 'sur les 7 derniers jours' : 'depuis ton arrivée' }}.
          </p>
          <p v-if="me.ahead" class="standing-ahead">
            {{ plural(me.ahead.gap, 'point') }} {{ me.ahead.gap > 1 ? 'te séparent' : 'te sépare' }} de
            <MuscleName :name="me.ahead.username" :level="me.ahead.level" class="standing-rival" />
            ({{ ordinal(me.ahead.rank) }}).
            <template v-if="me.next && me.next.date !== board.to">
              Demain, le prochain épisode peut te rapporter jusqu’à {{ plural(me.next.maxPoints, 'point') }}.
            </template>
            <template v-else-if="me.next">
              <RouterLink to="/">L’épisode du jour</RouterLink> peut te rapporter jusqu’à
              {{ plural(me.next.maxPoints, 'point') }}.
            </template>
          </p>
          <p v-else class="standing-ahead">Personne devant toi. Reste dans la course demain : ton Tux a des envieux.</p>
        </div>
      </section>

      <p v-else-if="signedIn" class="caption standing-none">
        {{
          board.period === 'week'
            ? 'Pas encore de points sur les 7 derniers jours.'
            : 'Pas encore de points.'
        }}
        Un épisode suffit pour entrer au classement :
        <RouterLink to="/">celui du jour t’attend</RouterLink>.
      </p>

      <section v-else class="guest-call panel">
        <Picture class="guest-egg" :image="sceneImage('egg')" alt="" />
        <p>
          Ton nom n’est pas encore dans la liste. Crée ton compte : ton Tux éclot, et chaque épisode lui donne du muscle
          et des points.
        </p>
        <RouterLink class="button" :to="{ path: '/inscription', query: { redirect: '/classement' } }">Créer mon compte</RouterLink>
      </section>

      <section class="board panel" :aria-label="`Classement : ${span}`">
        <p class="board-span">
          {{ span }}, {{ plural(board.players, 'joueur') }} {{ board.players > 1 ? 'ont' : 'a' }} marqué des points.
        </p>

        <p v-if="!board.players" class="board-empty">
          Personne n’a encore marqué de points sur cette période. Le premier épisode réussi place son joueur en tête.
        </p>

        <ol v-else class="rows">
          <template v-for="row in rows" :key="row.key">
            <li v-if="row.gap" class="row-gap" aria-hidden="true">
              <span></span><span></span><span></span>
            </li>
            <li v-else class="row" :class="{ 'row--me': row.me, 'row--podium': row.rank <= 3 }" :aria-current="row.me ? 'true' : undefined">
              <span class="row-rank">{{ row.rank }}</span>
              <Picture class="row-tux" :image="stageImage(row.level, { mini: true })" alt="" />
              <span class="row-who">
                <MuscleName :name="row.username" :level="row.level" class="row-name" />
                <span class="row-detail">
                  <template v-if="row.me">C’est toi. </template>
                  <template v-if="row.streak > 0">Série de {{ plural(row.streak, 'jour') }}</template>
                  <template v-else>Pas de série en cours</template>
                </span>
              </span>
              <span class="row-points">
                {{ formatNumber(row.points) }}<span class="row-unit">&nbsp;{{ row.points > 1 ? 'pts' : 'pt' }}</span>
              </span>
            </li>
          </template>
        </ol>

        <p v-if="scoring" class="board-rule">
          Une bonne réponse vaut {{ plural(scoring.correctAnswer, 'point') }}, un sans-faute
          {{ scoring.perfectBonus }} de plus, et chaque jour de série ajoute {{ plural(scoring.streakBonusPerDay, 'point') }},
          jusqu’à {{ scoring.streakBonusPerDay * scoring.streakBonusMaxDays }} par épisode. Les rattrapages ne comptent pas.
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.periods {
  display: flex;
  gap: 0;
  justify-self: start;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.period {
  padding: 0.45em 1em;
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
}

.period + .period {
  border-left: 2px solid var(--ink);
}

.period[aria-current='page'] {
  background: var(--ink);
  color: var(--caption);
}

/* Ta place : la case en tête de planche. */
.standing {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  background: var(--caption-pale);
  border-width: 4px;
}

.standing-tux {
  width: clamp(70px, 18vw, 110px);
}

.standing-text {
  display: grid;
  gap: 6px;
}

.standing-rank {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 10px;
  font-family: var(--font-title);
}

.standing-number {
  font-size: clamp(2.6rem, 10vw, 3.6rem);
  font-weight: 900;
  font-stretch: 120%;
  line-height: 0.9;
}

.standing-of {
  font-size: 1.2rem;
  font-weight: 650;
}

.standing-ahead {
  max-width: 52ch;
}

.standing-rival {
  font-size: 1.1em;
}

.standing-none {
  justify-self: start;
}

.guest-call {
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 8px 16px;
  align-items: center;
  padding: 14px 16px;
}

.guest-egg {
  grid-row: span 2;
  width: 74px;
}

.guest-call .button {
  justify-self: start;
}

/* Le tableau : une seule grande case, des rangées séparées par un trait. */
.board {
  padding: 0;
  overflow: hidden;
}

.board-span {
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: var(--line) solid var(--ink);
  background: var(--toque-pale);
}

.board-empty {
  padding: 18px 16px;
}

.rows {
  list-style: none;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 2.6rem 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 2px solid var(--rule);
}

.row-rank {
  font-family: var(--font-title);
  font-weight: 850;
  font-size: 1.25rem;
  text-align: right;
}

.row--podium .row-rank {
  font-size: 1.8rem;
  font-weight: 900;
  font-stretch: 120%;
}

.row-tux {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.row--podium .row-tux {
  width: 52px;
  height: 52px;
  margin-block: -4px;
}

.row-who {
  display: grid;
  min-width: 0;
}

.row-name {
  font-size: 1.15rem;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.row-detail {
  font-size: 0.86rem;
  color: var(--muted);
}

.row-points {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1.15rem;
  text-align: right;
  white-space: nowrap;
}

.row-unit {
  font-size: 0.8em;
  font-weight: 600;
  color: var(--muted);
}

.row--me {
  background: var(--caption);
  border-block: var(--line) solid var(--ink);
}

.row--me .row-detail,
.row--me .row-unit {
  color: var(--ink);
}

.row-gap {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-bottom: 2px solid var(--rule);
}

.row-gap span {
  width: 7px;
  height: 7px;
  background: var(--ink);
}

.board-rule {
  padding: 12px 16px;
  font-size: 0.9rem;
  color: var(--muted);
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 2rem 38px minmax(0, 1fr) auto;
    gap: 8px;
    padding: 8px 10px;
  }

  .row-tux {
    width: 38px;
    height: 38px;
  }

  .row--podium .row-rank {
    font-size: 1.5rem;
  }

  .row-name {
    font-size: 1rem;
  }

  .guest-call {
    grid-template-columns: 56px 1fr;
  }

  .guest-egg {
    width: 56px;
  }
}
</style>
