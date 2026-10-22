<script setup>
// Une liste de quêtes, avec leur barre de progression et leur récompense en sardines.
import Icon from './Icon.vue'

defineProps({
  quests: { type: Array, required: true },
  compact: { type: Boolean, default: false },
})

const ICONS = { daily: 'flamme', points: 'haltere', lessons: 'igloo', correct: 'cible', perfect: 'trophee' }
</script>

<template>
  <ul class="quests" :class="{ 'quests--compact': compact }">
    <li v-for="quest in quests" :key="quest.id" class="quest" :class="{ 'is-done': quest.done }">
      <Icon :name="ICONS[quest.id] || 'cible'" :size="compact ? 34 : 44" />
      <div class="quest-body">
        <p class="quest-title">{{ quest.title }}</p>
        <div class="quest-progress">
          <div class="meter" role="progressbar" :aria-valuenow="quest.value" :aria-valuemin="0" :aria-valuemax="quest.goal" :aria-label="quest.title">
            <div class="meter-fill" :data-empty="quest.value === 0" :style="{ width: `${(quest.value / quest.goal) * 100}%` }"></div>
            <span class="meter-text">{{ quest.value }} / {{ quest.goal }}</span>
          </div>
          <span class="quest-reward" :title="`${quest.reward} sardines`">
            <Icon :name="quest.done ? 'coffre-ouvert' : 'coffre'" :size="compact ? 30 : 36" />
            <span class="visually-hidden">{{ quest.done ? 'Récompense gagnée' : 'Récompense' }} : {{ quest.reward }} sardines</span>
          </span>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.quests {
  display: grid;
  padding: 0;
  list-style: none;
}

.quest {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.quest + .quest {
  border-top: 2px solid var(--rule);
}

.quests--compact .quest {
  padding: 12px 0;
}

.quest-body {
  flex: 1;
  display: grid;
  gap: 8px;
  min-width: 0;
}

.quest-title {
  font-weight: 800;
}

.quest-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quest-progress .meter {
  flex: 1;
  height: 18px;
}

.meter-text {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--ink);
  text-shadow:
    0 0 3px #fff,
    0 0 2px #fff;
}

.is-done .meter-fill {
  --meter: var(--success);
}

.is-done .meter-text {
  color: #fff;
}
</style>
