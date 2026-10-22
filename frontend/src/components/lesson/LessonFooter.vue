<script setup>
// Le bas de l'écran de leçon : le bouton « Valider », puis le verdict (vert ou rouge), avec
// l'explication et le bouton « Continuer ». Entrée fait l'un ou l'autre.
import { computed, nextTick, ref, watch } from 'vue'
import { typo } from '../../lib/format.js'

const props = defineProps({
  ready: { type: Boolean, default: false },
  sending: { type: Boolean, default: false },
  revealed: { type: Object, default: null },
  question: { type: Object, required: true },
  nextLabel: { type: String, default: 'Continuer' },
})

const emit = defineEmits(['check', 'next'])

const verdict = computed(() => {
  const r = props.revealed
  if (!r) return null
  return r.correct ? 'Bien vu !' : 'Raté…'
})

// Ce qui était juste, dit en clair quand les tuiles ne le montrent pas.
const truth = computed(() => {
  const { question, revealed } = props
  if (!revealed || revealed.correct) return null
  if (question.kind === 'trap') return revealed.solution === 'trap' ? 'C’était un piège.' : 'Ce n’était pas un piège.'
  if (question.kind === 'truefalse') return revealed.solution ? 'C’était vrai.' : 'C’était faux.'
  if (question.kind === 'choice') {
    const option = question.options.find((o) => o.id === revealed.solution)
    return option ? `La bonne réponse : ${typo(option.text)}` : null
  }
  if (question.kind === 'clues') {
    const found = revealed.answer.filter((zone) => revealed.solution.includes(zone)).length
    return found ? `${found} indice${found > 1 ? 's' : ''} sur ${revealed.solution.length} trouvé${found > 1 ? 's' : ''}.` : 'Aucun de tes choix n’était un indice.'
  }
  return null
})

const others = computed(() => {
  const rate = props.revealed?.success
  if (rate === null || rate === undefined) return null
  return `${rate} % des joueurs ont trouvé.`
})

const nextButton = ref(null)
watch(
  () => props.revealed,
  async (revealed) => {
    if (!revealed) return
    await nextTick()
    nextButton.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <footer class="footer" :class="revealed ? (revealed.correct ? 'footer--right' : 'footer--wrong') : ''">
    <div class="footer-inner">
      <div v-if="revealed" class="verdict" role="status" aria-live="polite">
        <span class="verdict-badge" aria-hidden="true">
          <svg v-if="revealed.correct" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" /></svg>
        </span>
        <div class="verdict-text">
          <p class="verdict-title">{{ verdict }}</p>
          <p v-if="truth" class="verdict-truth">{{ truth }}</p>
          <p class="verdict-explanation">{{ typo(revealed.explanation) }}</p>
          <p v-if="others" class="verdict-others">{{ others }}</p>
        </div>
      </div>

      <button v-if="revealed" ref="nextButton" type="button" class="button footer-button" :class="revealed.correct ? 'button--success' : 'button--danger'" @click="emit('next')">
        {{ nextLabel }}
      </button>
      <button v-else type="button" class="button button--success footer-button footer-check" :disabled="!ready || sending" @click="emit('check')">
        {{ sending ? 'Envoi…' : 'Valider' }}
      </button>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: var(--paper);
  border-top: 2px solid var(--rule);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px var(--gutter);
}

.footer--right {
  background: var(--success-pale);
  border-top-color: transparent;
}

.footer--wrong {
  background: var(--alert-pale);
  border-top-color: transparent;
}

.verdict {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.verdict-badge {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 64px;
  height: 64px;
  color: var(--success);
  background: var(--paper);
  border-radius: 50%;
}

.footer--wrong .verdict-badge {
  color: var(--alert);
}

.verdict-badge svg {
  width: 34px;
  height: 34px;
}

.verdict-text {
  display: grid;
  gap: 4px;
  max-height: 34vh;
  overflow-y: auto;
}

.verdict-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--success-ink);
}

.footer--wrong .verdict-title,
.footer--wrong .verdict-truth {
  color: var(--alert-ink);
}

.verdict-truth {
  font-weight: 800;
  color: var(--success-ink);
}

.verdict-explanation {
  font-size: 0.97rem;
}

.verdict-others {
  font-size: 0.85rem;
  color: var(--muted);
}

.footer-button {
  flex-shrink: 0;
  min-width: 180px;
}

@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    padding-block: 16px;
  }

  .verdict-badge {
    display: none;
  }

  .footer-button {
    width: 100%;
  }
}
</style>
