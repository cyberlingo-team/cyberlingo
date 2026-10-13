<script setup>
// Un épisode paru un autre jour : à relire si on l'a joué, à rattraper sinon. Le rattrapage
// corrige pareil, mais ne rapporte pas de points : la série se joue le jour même.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import EpisodePlayer from '../components/episode/EpisodePlayer.vue'
import LoadingPanel from '../components/comic/LoadingPanel.vue'
import ErrorPanel from '../components/comic/ErrorPanel.vue'
import NotFoundView from './NotFoundView.vue'
import { getMission } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { addDaysIso, formatDay, todayIso } from '../lib/format.js'

const route = useRoute()
const date = computed(() => String(route.params.date))

const { data, error, reload } = useResource(() => getMission(date.value))
const missing = computed(() => error.value?.status === 404)

const context = computed(() => {
  const { mission, progress } = data.value
  const day = formatDay(mission.date)
  if (progress.mode === 'counted') return `Paru le ${day}. Tu l’as joué ce jour-là : relis les cases et la correction.`
  if (progress.completed) return `Paru le ${day}. Tu l’as rattrapé : la correction reste là, les points se gagnent le jour même.`
  return `Paru le ${day}. En rattrapage, la correction est la même, mais les points et la série ne se gagnent que le jour même.`
})

const previous = computed(() => (data.value && data.value.mission.number > 1 ? addDaysIso(data.value.mission.date, -1) : null))
const following = computed(() => {
  if (!data.value) return null
  const next = addDaysIso(data.value.mission.date, 1)
  return next === todayIso() ? '/' : `/episode/${next}`
})
</script>

<template>
  <NotFoundView
    v-if="missing"
    title="Aucun épisode à cette date"
    text="Les épisodes paraissent un par jour depuis le lancement du site. Celui-ci n’existe pas, ou pas encore : pas de fuite des épisodes de demain."
  />
  <div v-else class="page">
    <ErrorPanel v-if="error && !data" :error="error" :retry="reload" />
    <LoadingPanel v-else-if="!data" label="Chargement de l’épisode" />
    <template v-else>
      <p class="caption archive-context">{{ context }}</p>
      <EpisodePlayer :key="data.mission.date" :mission="data.mission" :progress="data.progress" />
      <nav class="archive-nav" aria-label="Épisodes voisins">
        <RouterLink v-if="previous" class="button button--paper button--small" :to="`/episode/${previous}`">
          Épisode {{ data.mission.number - 1 }}
        </RouterLink>
        <RouterLink class="archive-all" to="/episodes">Tous les épisodes</RouterLink>
        <RouterLink class="button button--paper button--small" :to="following">
          {{ following === '/' ? 'Épisode du jour' : `Épisode ${data.mission.number + 1}` }}
        </RouterLink>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.archive-context {
  justify-self: start;
  max-width: 64ch;
  transform: rotate(-0.5deg);
}

.archive-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.archive-nav > :first-child {
  justify-self: start;
}

.archive-nav > :last-child {
  justify-self: end;
  grid-column: 3;
}

.archive-all {
  grid-column: 2;
  font-weight: 600;
}
</style>
