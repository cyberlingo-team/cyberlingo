<script setup>
// Une quête, à la manière de la copie de référence : son icône, son titre, sa barre de
// progression et le coffre de récompense au bout.
import Icon from './Icon.vue'

defineProps({
  quest: { type: Object, required: true },
})

const ICONS = { daily: 'flamme', points: 'haltere', lessons: 'igloo', correct: 'cible', perfect: 'trophee', monthly: 'trophee' }
</script>

<template>
  <div class="cl-quest-card" :class="{ done: quest.done }">
    <Icon :name="ICONS[quest.id] || 'cible'" :size="44" />
    <div>
      <strong>{{ quest.title }}</strong>
      <div class="cl-quest-progress" role="progressbar" :aria-valuenow="quest.value" :aria-valuemin="0" :aria-valuemax="quest.goal" :aria-label="quest.title">
        <span :style="{ width: `${Math.min(100, (quest.value / quest.goal) * 100)}%` }"></span><b>{{ quest.value }} / {{ quest.goal }}</b>
      </div>
    </div>
    <Icon class="cl-quest-chest" :name="quest.done ? 'coffre-ouvert' : 'coffre'" :size="40" :alt="`${quest.done ? 'Récompense gagnée' : 'Récompense'} : ${quest.reward} sardines`" />
  </div>
</template>
