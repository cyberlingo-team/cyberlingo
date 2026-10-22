<script setup>
// Le bas de l'écran de leçon, repris de la copie de référence : « Passer » et « Valider », puis
// le verdict (vert ou rouge) avec la bonne réponse, l'explication et « Continuer ».
import { computed, nextTick, ref, watch } from 'vue'
import { typo } from '../../lib/format.js'

const props = defineProps({
  ready: { type: Boolean, default: false },
  sending: { type: Boolean, default: false },
  revealed: { type: Object, default: null },
  question: { type: Object, required: true },
  nextLabel: { type: String, default: 'Continuer' },
  // En fin de leçon, on rejoue les questions ratées : on ne peut plus les passer.
  canSkip: { type: Boolean, default: true },
})

const emit = defineEmits(['check', 'skip', 'next'])

// Ce qui était juste, dit en clair.
const truth = computed(() => {
  const { question, revealed } = props
  if (!revealed || revealed.correct) return null
  if (question.kind === 'trap') return revealed.solution === 'trap' ? 'C’était un piège.' : 'Ce n’était pas un piège.'
  if (question.kind === 'truefalse') return revealed.solution ? 'C’était vrai.' : 'C’était faux.'
  if (question.kind === 'choice') return typo(question.options.find((o) => o.id === revealed.solution)?.text || '')
  if (question.kind === 'clues') {
    const found = (revealed.answer || []).filter((zone) => revealed.solution.includes(zone)).length
    return found ? `${found} indice${found > 1 ? 's' : ''} sur ${revealed.solution.length} trouvé${found > 1 ? 's' : ''}.` : 'Aucun indice trouvé.'
  }
  return null
})

// Pour les indices, la ligne du dessous dit combien ont été trouvés : « Bonne réponse : » ne va pas.
const heading = computed(() => {
  const { question, revealed } = props
  if (revealed.correct) return 'Excellent !'
  if (revealed.answer === null) return question.kind === 'clues' ? 'Question passée.' : 'Question passée. Bonne réponse :'
  return question.kind === 'clues' ? 'Pas tout à fait…' : 'Bonne réponse :'
})

const others = computed(() => {
  const rate = props.revealed?.success
  return rate === null || rate === undefined ? null : `${rate} % des joueurs ont trouvé.`
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
  <footer class="cl-lesson-footer" :class="{ correct: revealed?.correct, incorrect: revealed && !revealed.correct }">
    <div>
      <section v-if="revealed" class="cl-feedback" role="status">
        <span class="cl-feedback-icon" aria-hidden="true">
          <svg v-if="revealed.correct" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" /></svg>
        </span>
        <div class="cl-feedback-text">
          <h2>{{ heading }}</h2>
          <p v-if="truth" class="cl-truth">{{ truth }}</p>
          <p class="cl-explanation">{{ typo(revealed.explanation) }}</p>
          <p v-if="others" class="cl-others">{{ others }}</p>
        </div>
      </section>
      <button v-else-if="canSkip" type="button" class="cl-button" :disabled="sending" @click="emit('skip')">Passer</button>
      <span v-else></span>

      <button v-if="revealed" ref="nextButton" type="button" class="cl-button green" :class="{ red: !revealed.correct }" @click="emit('next')">
        {{ nextLabel }}
      </button>
      <button v-else type="button" class="cl-button green" :disabled="!ready || sending" @click="emit('check')">
        {{ sending ? 'Envoi…' : 'Valider' }}
      </button>
    </div>
  </footer>
</template>

<style scoped>
/* Notre correction est plus longue que celle de la copie : le pied s'allonge avec elle. */
.cl-lesson-footer {
  height: auto;
  min-height: 140px;
}

.cl-lesson-footer > div {
  min-height: 140px;
  padding-block: 24px;
}

.cl-feedback {
  align-items: flex-start;
  min-width: 0;
}

.cl-feedback-icon svg {
  width: 44px;
  height: 44px;
}

.cl-feedback-text {
  display: grid;
  gap: 4px;
  max-height: 38vh;
  overflow-y: auto;
}

.cl-truth {
  font-size: 18px;
  font-weight: 800;
}

.cl-explanation {
  color: var(--ink);
}

.cl-others {
  font-size: 14px;
  color: var(--muted);
}

.cl-lesson-footer .cl-button:disabled {
  color: #9aa0b4;
  background: var(--rule);
  border-color: var(--rule);
}

@media (max-width: 699px) {
  .cl-lesson-footer {
    min-height: 110px;
  }

  .cl-lesson-footer > div {
    min-height: 110px;
    flex-wrap: wrap;
    padding-block: 16px;
  }

  .cl-feedback {
    flex-basis: 100%;
  }

  .cl-feedback-icon {
    display: none;
  }

  .cl-app .cl-feedback h2 {
    font-size: 20px;
  }

  .cl-explanation {
    font-size: 15px;
    line-height: 21px;
  }
}
</style>
