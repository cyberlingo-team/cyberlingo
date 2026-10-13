<script setup>
// La planche de l'épisode en miniature : une vignette par case, puis la fin. Elle montre où en
// est le joueur, et permet de relire une case déjà jouée.
import { computed } from 'vue'

const props = defineProps({
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
  current: { type: Number, default: 0 },
  phase: { type: String, default: 'case' },
  completed: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'ending'])

const cells = computed(() =>
  props.questions.map((question, index) => {
    const answer = props.answers[question.id]
    const state = answer ? (answer.correct ? 'right' : 'wrong') : 'todo'
    const isCurrent = props.phase === 'case' && index === props.current
    const status = answer ? (answer.correct ? 'bonne réponse' : 'mauvaise réponse') : isCurrent ? 'en cours' : 'à venir'
    return { id: question.id, index, state, isCurrent, status, available: Boolean(answer) && !isCurrent }
  }),
)

const position = computed(() =>
  props.phase === 'ending' ? 'Fin de l’épisode' : `Case ${props.current + 1} sur ${props.questions.length}`,
)
</script>

<template>
  <nav class="strip" aria-label="Cases de l’épisode">
    <p class="strip-position" aria-live="polite">{{ position }}</p>
    <ol class="strip-cells">
      <li v-for="cell in cells" :key="cell.id">
        <button
          type="button"
          class="strip-cell"
          :class="[`strip-cell--${cell.state}`, { 'is-current': cell.isCurrent }]"
          :disabled="!cell.available"
          :aria-current="cell.isCurrent ? 'step' : undefined"
          :aria-label="`Case ${cell.index + 1} : ${cell.status}`"
          @click="emit('select', cell.index)"
        >
          <svg v-if="cell.state === 'right'" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <svg v-else-if="cell.state === 'wrong'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
          <span v-else aria-hidden="true">{{ cell.index + 1 }}</span>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="strip-cell strip-cell--end"
          :class="{ 'is-current': phase === 'ending' }"
          :disabled="!completed || phase === 'ending'"
          :aria-current="phase === 'ending' ? 'step' : undefined"
          aria-label="Fin de l’épisode"
          @click="emit('ending')"
        >
          Fin
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.strip-position {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1.05rem;
}

.strip-cells {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 5px;
}

.strip-cell {
  display: grid;
  place-items: center;
  width: 38px;
  height: 44px;
  padding: 0;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1rem;
  color: var(--muted);
  background: var(--paper);
  border: 2px solid var(--ink);
}

.strip-cell svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.strip-cell--right {
  color: var(--paper);
  background: var(--toque);
}

.strip-cell--wrong {
  color: var(--paper);
  background: var(--alert);
}

.strip-cell--end {
  width: 52px;
  font-size: 0.95rem;
  color: var(--ink);
}

.strip-cell.is-current {
  color: var(--ink);
  background: var(--caption);
  border-width: 3px;
  transform: translateY(-3px);
}

.strip-cell:disabled {
  cursor: default;
}

.strip-cell:not(:disabled):hover {
  outline: 3px solid var(--caption);
  outline-offset: 1px;
}
</style>
