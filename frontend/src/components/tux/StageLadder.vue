<script setup>
// Les huit stades du Tux, du Poussin au Brise-glace, alignés par taille. Ceux qu'on n'a pas
// encore atteints restent en ombre chinoise : on sait qu'ils existent, pas à quoi ils ressemblent.
import Picture from '../comic/Picture.vue'
import { stageImage } from '../../lib/images.js'
import { formatNumber } from '../../lib/format.js'

defineProps({
  stages: { type: Array, required: true },
  // Stade atteint par le joueur, ou null pour un visiteur : tout est alors montré.
  level: { type: Number, default: null },
})
</script>

<template>
  <ol class="ladder">
    <li
      v-for="stage in stages"
      :key="stage.level"
      class="step"
      :class="{
        'is-current': level === stage.level,
        'is-locked': level !== null && stage.level > level,
      }"
      :style="{ '--grow': stage.level }"
    >
      <Picture
        class="step-tux"
        :image="stageImage(stage.level, { mini: true })"
        :alt="level !== null && stage.level > level ? 'Stade pas encore atteint' : stage.name"
      />
      <span class="step-name">{{ level !== null && stage.level > level ? '?' : stage.name }}</span>
      <span class="step-points">{{ stage.minPoints ? `${formatNumber(stage.minPoints)} pts` : 'au départ' }}</span>
    </li>
  </ol>
</template>

<style scoped>
.ladder {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  align-items: end;
  gap: 6px;
}

.step {
  display: grid;
  justify-items: center;
  gap: 2px;
  text-align: center;
  padding: 6px 2px;
  border-bottom: 4px solid transparent;
}

.step-tux {
  width: calc(36% + var(--grow) * 9%);
  max-width: 100%;
}

.step-name {
  font-family: var(--font-title);
  font-weight: 750;
  font-size: 0.82rem;
  line-height: 1.05;
  overflow-wrap: anywhere;
  hyphens: auto;
}

.step-points {
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
}

.is-current {
  background: var(--caption);
  border-bottom-color: var(--ink);
}

.is-current .step-points {
  color: var(--ink);
}

.is-locked .step-tux {
  filter: brightness(0);
  opacity: 0.28;
}

.is-locked .step-name {
  color: var(--muted);
}

@media (max-width: 560px) {
  .ladder {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    row-gap: 12px;
  }

  .step-tux {
    width: calc(40% + var(--grow) * 7%);
  }
}
</style>
