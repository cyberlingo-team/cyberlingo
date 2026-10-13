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

const verdict = computed(() => (props.revealed.correct ? 'Bien vu !' : 'Raté !'))

// Pour une question à indices : les choix du joueur comparés aux vrais indices.
const clues = computed(() => {
  const { question, revealed } = props
  if (question.kind !== 'clues' || !Array.isArray(revealed.solution) || !Array.isArray(revealed.answer)) return null
  const found = revealed.answer.filter((zone) => revealed.solution.includes(zone)).length
  return {
    found,
    wrong: revealed.answer.length - found,
    extra: revealed.solution.length - found,
    good: props.notes.some((note) => note.good),
  }
})

// Ce qui était juste, dit en clair quand la réponse ne le montre pas déjà.
const truth = computed(() => {
  const { question, revealed } = props
  if (question.kind === 'trap') {
    if (revealed.solution === 'trap') return revealed.correct ? 'C’était bien un piège.' : 'C’était un piège.'
    return revealed.correct ? 'Ce message était fiable.' : 'Ce n’était pas un piège.'
  }
  if (question.kind === 'truefalse') return revealed.solution ? 'C’est vrai.' : 'C’est faux.'
  const c = clues.value
  if (c) {
    if (!c.wrong) {
      const all = c.found > 1 ? `Tes ${c.found} choix sont de vrais indices.` : 'Ton choix est un vrai indice.'
      return c.extra ? `${all} Il y en avait même un de plus.` : all
    }
    if (!c.found) return 'Aucun de tes choix n’était un indice.'
    return c.wrong > 1 ? `${c.wrong} de tes choix n’étaient pas des indices.` : 'Un de tes choix n’était pas un indice.'
  }
  return null
})

// La part des joueurs qui ont trouvé, dite sans en faire trop.
const others = computed(() => {
  const rate = props.revealed.success
  if (rate === null || rate === undefined) return null
  const share = `${rate < 40 ? 'Seulement ' : ''}${rate} % des joueurs ont trouvé`
  if (rate < 50 && props.revealed.correct) return `${share}. Tu en fais partie.`
  if (rate >= 40 && rate < 60) return `${share} : celle-là divise.`
  return `${share}.`
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
      <Balloon tail="left-down" class="feedback-balloon">
        <p class="feedback-verdict">{{ verdict }}</p>
        <p v-if="truth" class="feedback-truth">{{ truth }}</p>
        <p class="feedback-explanation">{{ typo(revealed.explanation) }}</p>
      </Balloon>
    </div>

    <ul v-if="clues" class="feedback-key" aria-label="Comment lire la correction">
      <li><span class="key key--picked">Surligné</span> : ce que tu as touché.</li>
      <li><span class="key key--bad">Entouré en rouge</span> : un vrai indice.</li>
      <li v-if="clues.wrong"><span class="key key--wrong">Barré</span> : ce n’était pas un indice.</li>
      <li v-if="clues.good"><span class="key key--good">Entouré en bleu</span> : un détail qui ne trahit rien.</li>
    </ul>

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

/* La légende de la correction, avec les mêmes marques que sur le document. */
.feedback-key {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 22px;
  font-size: 0.95rem;
}

.key {
  padding: 0 0.3em;
  font-weight: 700;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.key--picked {
  background: var(--caption);
}

.key--bad,
.key--good {
  border-radius: 0.9em 0.7em 1em 0.6em;
  box-shadow: 0 0 0 2px var(--alert);
}

.key--good {
  box-shadow: 0 0 0 2px var(--toque);
}

.key--wrong {
  background: var(--caption);
  text-decoration: line-through;
  text-decoration-color: var(--alert);
  text-decoration-thickness: 2px;
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

/* Sur téléphone, la bulle prend toute la largeur et le prof parle d'en dessous. */
@media (max-width: 640px) {
  .feedback-scene {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .feedback-balloon {
    grid-row: 1;
  }

  .feedback-prof {
    width: 86px;
    margin-left: 4px;
  }
}

@media (max-width: 520px) {
  .feedback-next {
    width: 100%;
  }
}
</style>
