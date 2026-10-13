<script setup>
// L'épisode du jour, le même pour tout le monde. C'est la page d'accueil.
import { ref } from 'vue'
import EpisodePlayer from '../components/episode/EpisodePlayer.vue'
import Previously from '../components/episode/Previously.vue'
import LoadingPanel from '../components/comic/LoadingPanel.vue'
import ErrorPanel from '../components/comic/ErrorPanel.vue'
import { getMe, getTodayMission } from '../api/index.js'
import { loadSession, refreshSession } from '../lib/session.js'
import { useResource } from '../lib/resource.js'

const version = ref(0)

const { data, error, reload } = useResource(async () => {
  const [today, user] = await Promise.all([getTodayMission(), loadSession()])
  let me = null
  if (user) {
    try {
      me = await getMe()
    } catch (cause) {
      if (cause.status !== 401) throw cause
    }
  }
  version.value += 1
  return { ...today, me }
})

function onFinished() {
  refreshSession()
}
</script>

<template>
  <div class="page">
    <ErrorPanel v-if="error && !data" :error="error" :retry="reload" />
    <LoadingPanel v-else-if="!data" label="Chargement de l’épisode du jour" />
    <template v-else>
      <Previously :me="data.me" :progress="data.progress" :question-count="data.mission.questions.length" />
      <EpisodePlayer
        :key="version"
        :mission="data.mission"
        :progress="data.progress"
        :stats="data.stats"
        is-today
        @finished="onFinished"
        @conflict="reload"
      />
    </template>
  </div>
</template>
