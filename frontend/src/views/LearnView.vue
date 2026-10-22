<script setup>
// « Apprendre » : la mission du jour en tête, puis le chemin des thèmes.
import AppShell from '../components/app/AppShell.vue'
import StatePanel from '../components/app/StatePanel.vue'
import DailyCard from '../components/path/DailyCard.vue'
import LearningPath from '../components/path/LearningPath.vue'
import { getPath } from '../api/index.js'
import { useResource } from '../lib/resource.js'

const { data: path, error, reload } = useResource(getPath)
</script>

<template>
  <AppShell>
    <h1 class="visually-hidden">Apprendre</h1>
    <StatePanel v-if="error" state="error" :error="error" :retry="reload" />
    <StatePanel v-else-if="!path" label="On prépare ton chemin…" />
    <template v-else>
      <DailyCard :daily="path.daily" />
      <LearningPath :path="path" @changed="reload" />
    </template>
  </AppShell>
</template>
