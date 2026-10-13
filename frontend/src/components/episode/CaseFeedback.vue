<script setup>
// La correction de Tux le prof : son verdict, l'explication, ses annotations au stylo rouge
// (numérotées comme sur l'objet) et la part des joueurs qui ont trouvé.
import { computed, onMounted, ref } from 'vue'
import Balloon from '../comic/Balloon.vue'
import Picture from '../comic/Picture.vue'
import { sceneImage } from '../../lib/images.js'
import { typo } from '../../lib/format.js'
import { reducedMotion } from '../../lib/preferences.js'

const props = defineProps({
  question: { type: Object, required: true },
  revealed: { type: Object, required: true },
  notes: { type: Array, default: () => [] },
  isLast: { type: Boolean, default: false },
  fresh: { type: Boolean, default: false },
  nextLabel: { type: String, default: '' },
})

const emit = defineEmits(['next'])

const root = ref(null)

const verdict = computed(() => (props.revealed.correct ? 'Bien vu !' : 'Raté !'))

// Ce qui était juste, dit en clair quand la réponse ne le montre pas déjà.
const truth = computed(() => {
  const { question, revealed } = props
  if (question.kind === 'trap') {
    if (revealed.solution === 'trap') return revealed.correct ? 'C’était bien un piège.' : 'C’était un piège.'
    return revealed.correct ? 'Ce message était fiable.' : 'Ce n’était pas un piège.'
  }
  if (question.kind === 'truefalse') return revealed.solution ? 'C’est vrai.' : 'C’est faux.'
  if (question.kind === 'clues' && !revealed.correct) return 'Les vrais indices sont entourés en rouge sur le document.'
  return null
})

const others = computed(() => {
  const rate = props.revealed.success
  if (rate === null || rate === undefined) return null
  if (rate >= 80) return `${rate} % des joueurs ont trouvé.`
  if (rate >= 50) return `${rate} % des joueurs ont trouvé : pas si facile.`
  return `Seulement ${rate} % des joueurs ont trouvé.`
})

const buttonLabel = computed(() => props.nextLabel || (props.isLast ? 'Voir la fin de l’épisode' : 'Case suivante'))

onMounted(() => {
  if (!props.fresh || !root.value) return
  root.value.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' })
  root.value.focus({ preventScroll: true })
})
</script>

<template>
  <section ref="root" class="feedback" :class="revealed.correct ? 'feedback--right' : 'feedback--wrong'" tabindex="-1" aria-live="polite">
    <div class="feedback-scene">
      <Picture
        class="feedback-prof"
        :image="sceneImage(revealed.correct ? 'prof-magnifier' : 'prof-facepalm')"
        :alt="revealed.correct ? 'Tux le prof, loupe à la main, approuve.' : 'Tux le prof se tape le front.'"
        eager
      />
      <Balloon tail="left" class="feedback-balloon">
        <p class="feedback-verdict">{{ verdict }}</p>
        <p v-if="truth" class="feedback-truth">{{ truth }}</p>
        <p class="feedback-explanation">{{ typo(revealed.explanation) }}</p>
      </Balloon>
    </div>

    <ol v-if="notes.length" class="feedback-notes" aria-label="Annotations du prof">
      <li v-for="note in notes" :key="note.zone" :class="{ 'is-good': note.good }">
        <span class="feedback-note-number" aria-hidden="true">{{ note.number }}</span>
        <span>{{ typo(note.text) }}</span>
      </li>
    </ol>

    <div class="feedback-foot">
      <p v-if="others" class="feedback-others">{{ others }}</p>
      <button type="button" class="button feedback-next" @click="emit('next')">{{ buttonLabel }}</button>
    </div>
  </section>
</template>

<style scoped>
.feedback {
  display: grid;
  gap: 16px;
  padding: clamp(14px, 3.4vw, 24px);
  background: var(--paper);
  border: var(--line) solid var(--ink);
  border-top-width: 10px;
  animation: feedback-in 0.28s ease-out both;
}

.feedback:focus {
  outline: none;
}

.feedback--right {
  border-top-color: var(--toque);
}

.feedback--wrong {
  border-top-color: var(--alert);
}

.feedback-scene {
  display: grid;
  grid-template-columns: clamp(84px, 22vw, 150px) 1fr;
  align-items: end;
  gap: 26px;
}

.feedback-prof {
  width: 100%;
}

.feedback-balloon {
  align-self: center;
  display: grid;
  gap: 6px;
}

.feedback-verdict {
  font-family: var(--font-title);
  font-size: clamp(1.7rem, 6vw, 2.3rem);
  font-weight: 900;
  font-stretch: 115%;
  line-height: 1;
}

.feedback--right .feedback-verdict {
  color: var(--toque);
}

.feedback--wrong .feedback-verdict {
  color: var(--alert);
}

.feedback-truth {
  font-weight: 700;
}

.feedback-notes {
  list-style: none;
  margin: 0;
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  background: var(--alert-pale);
  border-left: 4px solid var(--alert);
  color: #5a120c;
}

.feedback-notes li {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 10px;
  align-items: start;
}

.feedback-note-number {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-top: 1px;
  border-radius: 50%;
  background: var(--alert);
  color: var(--paper);
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.85rem;
}

.feedback-notes li.is-good .feedback-note-number {
  background: var(--toque);
}

.feedback-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 18px;
}

.feedback-others {
  color: var(--muted);
}

.feedback-next {
  margin-left: auto;
}

@keyframes feedback-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@media (max-width: 520px) {
  .feedback-scene {
    grid-template-columns: 78px 1fr;
    gap: 22px;
  }

  .feedback-next {
    width: 100%;
  }
}
</style>
