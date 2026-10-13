<script setup>
// Une case de l'épisode : le récitatif, l'invité qui parle, l'objet à examiner, la question du
// prof et, une fois la réponse donnée, sa correction.
import { computed, ref } from 'vue'
import ArtifactView from '../artifacts/ArtifactView.vue'
import Balloon from '../comic/Balloon.vue'
import Picture from '../comic/Picture.vue'
import Stamp from '../comic/Stamp.vue'
import ErrorPanel from '../comic/ErrorPanel.vue'
import AnswerControls from './AnswerControls.vue'
import CaseFeedback from './CaseFeedback.vue'
import { sendAnswer } from '../../api/index.js'
import { gangImage } from '../../lib/images.js'
import { typo } from '../../lib/format.js'
import { zonesOf } from '../../lib/zones.js'
import { playSound } from '../../lib/sound.js'
import logoHead from '../../assets/brand/tux-prof-tete.svg'

const props = defineProps({
  date: { type: String, required: true },
  question: { type: Object, required: true },
  guest: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  revealed: { type: Object, default: null },
  nextLabel: { type: String, default: '' },
})

const emit = defineEmits(['answered', 'next', 'conflict'])

const selectedZones = ref([])
const sending = ref(false)
const error = ref(null)
const pendingAnswer = ref(null)
const fullWarning = ref(false)
const fresh = ref(false)

const artifactMode = computed(() => {
  if (props.revealed) return 'review'
  return props.question.kind === 'clues' ? 'pick' : 'read'
})

// Les annotations du prof, numérotées dans l'ordre où elles apparaissent sur l'objet.
const notes = computed(() => {
  if (!props.revealed) return []
  const order = zonesOf(props.question.artifact)
  const solution = Array.isArray(props.revealed.solution) ? props.revealed.solution : []
  return [...props.revealed.notes]
    .sort((a, b) => order.indexOf(a.zone) - order.indexOf(b.zone))
    .map((note, i) => ({ ...note, number: i + 1, good: props.question.kind === 'clues' && !solution.includes(note.zone) }))
})

const noteNumbers = computed(() => Object.fromEntries(notes.value.map((note) => [note.zone, note.number])))

const stamp = computed(() => {
  if (!props.revealed || props.question.kind !== 'trap') return null
  return props.revealed.solution === 'trap' ? { tone: 'alert', label: 'Piège' } : { tone: 'safe', label: 'Fiable' }
})

async function submit(answer) {
  if (sending.value) return
  sending.value = true
  error.value = null
  pendingAnswer.value = answer
  try {
    const result = await sendAnswer(props.date, props.question.id, answer)
    fresh.value = true
    playSound(props.question.kind === 'trap' ? 'stamp' : result.correct ? 'correct' : 'wrong')
    if (props.question.kind === 'trap') setTimeout(() => playSound(result.correct ? 'correct' : 'wrong'), 260)
    emit('answered', props.question.id, result)
  } catch (cause) {
    // Déjà répondu ailleurs (autre onglet) : on recharge l'épisode tel que le serveur le connaît.
    if (cause.status === 409) emit('conflict')
    else error.value = cause
  } finally {
    sending.value = false
  }
}

function retry() {
  return submit(pendingAnswer.value)
}

function onFull() {
  fullWarning.value = true
  setTimeout(() => (fullWarning.value = false), 2600)
}
</script>

<template>
  <div class="case-wrap">
    <article class="case panel" :aria-labelledby="`case-title-${question.id}`">
      <h2 :id="`case-title-${question.id}`" class="visually-hidden">Case {{ index + 1 }} sur {{ total }}</h2>
      <p class="case-scene caption">{{ typo(question.scene) }}</p>

      <div class="case-stage" :class="{ 'case-stage--solo': !question.artifact }">
        <div class="case-guest">
          <Balloon v-if="question.line" tail="down-left" class="case-line">
            <span class="visually-hidden">{{ guest.name }} :</span>
            {{ typo(question.line) }}
          </Balloon>
          <Picture class="case-guest-image" :image="gangImage(guest.id)" :alt="guest.look || guest.name" eager />
        </div>

        <div v-if="question.artifact" class="case-object">
          <ArtifactView
            v-model:selected="selectedZones"
            :artifact="question.artifact"
            :mode="artifactMode"
            :pick="question.pick || 0"
            :note-numbers="noteNumbers"
            :solution="question.kind === 'clues' && revealed ? revealed.solution : null"
            :picked="question.kind === 'clues' && revealed ? revealed.answer : null"
            :guest-name="guest.name"
            @full="onFull"
          >
            <Stamp v-if="stamp" class="case-stamp" :tone="stamp.tone" :animate="fresh">{{ stamp.label }}</Stamp>
          </ArtifactView>
          <p v-if="fullWarning" class="case-full" role="status">
            Tu as déjà choisi {{ question.pick }} indices. Touche-en un pour le retirer.
          </p>
        </div>
      </div>
    </article>

    <section class="ask panel" :aria-labelledby="`ask-${question.id}`">
      <p :id="`ask-${question.id}`" class="ask-prompt">
        <img :src="logoHead" class="ask-prof" width="40" height="40" alt="Tux le prof demande :" />
        <span>{{ typo(question.prompt) }}</span>
      </p>
      <AnswerControls
        :question="question"
        :revealed="revealed"
        :sending="sending"
        :selected-zones="selectedZones"
        @answer="submit"
        @clear="selectedZones = []"
      />
      <ErrorPanel v-if="error" :error="error" :retry="retry" compact />
    </section>

    <CaseFeedback
      v-if="revealed"
      :question="question"
      :revealed="revealed"
      :notes="notes"
      :is-last="index === total - 1"
      :fresh="fresh"
      :next-label="nextLabel"
      @next="emit('next')"
    />
  </div>
</template>

<style scoped>
.case-wrap {
  display: grid;
  gap: var(--gutter);
}

.case {
  padding: 0 clamp(12px, 3vw, 24px) clamp(14px, 3vw, 24px);
}

.case-scene {
  justify-self: start;
  max-width: min(100%, 520px);
  margin: 0 0 14px calc(-1 * clamp(12px, 3vw, 24px));
  border-width: 0 3px 3px 0;
  border-color: var(--ink);
  border-style: solid;
  font-size: 1.02rem;
}

.case-stage {
  display: grid;
  grid-template-columns: minmax(150px, 0.8fr) minmax(0, 1.6fr);
  align-items: end;
  gap: 18px clamp(16px, 3vw, 32px);
}

.case-stage--solo {
  grid-template-columns: 1fr;
  justify-items: center;
}

.case-guest {
  display: grid;
  justify-items: start;
  gap: 32px;
  align-self: stretch;
  align-content: end;
}

.case-stage--solo .case-guest {
  justify-items: center;
  max-width: 460px;
}

.case-line {
  font-size: 1.05rem;
}

.case-guest-image {
  width: auto;
  max-width: 100%;
  max-height: 210px;
  object-fit: contain;
}

.case-object {
  position: relative;
  display: grid;
  gap: 10px;
  justify-items: start;
}

.case-object :deep(.artifact) {
  width: 100%;
  transform: rotate(-0.5deg);
}

.case-stamp {
  position: absolute;
  top: 34%;
  left: 50%;
  translate: -50% 0;
  font-size: clamp(2rem, 9vw, 3rem);
  pointer-events: none;
  z-index: 2;
}

.case-full {
  font-weight: 600;
  color: var(--alert);
}

.ask {
  display: grid;
  gap: 14px;
  padding: clamp(14px, 3vw, 22px);
}

.ask-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 4.6vw, 1.7rem);
  font-weight: 800;
  line-height: 1.15;
}

.ask-prof {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}

@media (max-width: 640px) {
  .case-stage {
    grid-template-columns: 1fr;
  }

  .case-guest {
    grid-template-columns: 84px 1fr;
    align-items: end;
    gap: 10px 26px;
  }

  .case-guest-image {
    grid-row: 1;
    grid-column: 1;
    max-height: 110px;
  }

  .case-line {
    grid-row: 1;
    grid-column: 2;
    align-self: center;
  }

  .case-stage--solo .case-guest {
    grid-template-columns: 110px 1fr;
  }
}
</style>
