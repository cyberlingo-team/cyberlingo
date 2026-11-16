<script setup>
// Une question de leçon, sur le gabarit de l'exercice de la copie de référence : la consigne,
// le personnage invité qui parle dans sa bulle, l'objet à examiner et les réponses numérotées.
//   trap       « Piège » ou « Fiable »
//   truefalse  « Vrai » ou « Faux »
//   choice     une proposition parmi trois ou quatre
//   clues      toucher les indices dans l'objet
// Après la réponse, le même écran montre la correction : la bonne réponse, et les annotations
// numérotées du prof sur l'objet.
import { computed, nextTick, ref, watch } from 'vue'
import ArtifactView from '../artifacts/ArtifactView.vue'
import { gangImage } from '../../lib/images.js'
import { zonesOf, zoneStatus, ZONE_STATUS_LABELS } from '../../lib/zones.js'
import { typo } from '../../lib/format.js'

const props = defineProps({
  question: { type: Object, required: true },
  guest: { type: Object, required: true },
  // La réponse en cours : 'trap', true, l'id d'une option, ou la liste des zones touchées.
  choice: { default: null },
  revealed: { type: Object, default: null },
  locked: { type: Boolean, default: false },
  // La question revient en fin de leçon parce qu'elle avait été ratée.
  review: { type: Boolean, default: false },
})

const emit = defineEmits(['update:choice'])

const BINARY = {
  trap: [
    { value: 'trap', label: 'Piège', hint: 'C’est une arnaque' },
    { value: 'safe', label: 'Fiable', hint: 'On peut y aller' },
  ],
  truefalse: [
    { value: true, label: 'Vrai', hint: 'L’affirmation est juste' },
    { value: false, label: 'Faux', hint: 'L’affirmation est fausse' },
  ],
}


const options = computed(() => {
  const { kind, options } = props.question
  if (BINARY[kind]) return BINARY[kind]
  if (kind === 'choice') return options.map((option) => ({ value: option.id, label: typo(option.text) }))
  return []
})

// L'affirmation d'une question vrai ou faux.
const statement = computed(() => (props.question.kind === 'truefalse' ? typo(props.question.prompt).replace(/\.$/, '') : null))

const zones = computed(() => (Array.isArray(props.choice) ? props.choice : []))
const answered = computed(() => Boolean(props.revealed))

// La bulle : la réplique du personnage, ou à défaut la scène.
const speech = computed(() => typo(props.question.line ? `« ${props.question.line} »` : props.question.scene || ''))

function pick(value) {
  if (props.locked || answered.value) return
  emit('update:choice', value)
}

function optionState(value) {
  const r = props.revealed
  if (!r) return props.choice === value ? 'selected' : ''
  if (r.solution === value) return 'right'
  if (r.answer === value) return 'wrong'
  return 'dimmed'
}

// L'ordre de lecture des zones, tel qu'il s'affiche, pour numéroter les annotations du prof.
const artifactView = ref(null)
const readingOrder = ref([])

watch(
  () => props.revealed,
  async (revealed) => {
    if (!revealed) return
    await nextTick()
    const root = artifactView.value?.$el
    if (root) readingOrder.value = [...new Set([...root.querySelectorAll('[data-zone]')].map((el) => el.dataset.zone))]
  },
  { immediate: true },
)

// Les annotations du prof, numérotées dans l'ordre de lecture. Chacune prend l'état de sa zone
// (voir zoneStatus) : sur une question à indices, il dit si le joueur l'a touchée et si c'était
// un indice ; ailleurs, si le détail trahit l'arnaque ou rassure (« good »).
const notes = computed(() => {
  if (!props.revealed?.notes) return []
  const { kind } = props.question
  const order = readingOrder.value.length ? readingOrder.value : zonesOf(props.question.artifact)
  const rank = (zone) => (order.includes(zone) ? order.indexOf(zone) : order.length)
  const clues = kind === 'clues' && Array.isArray(props.revealed.solution)
  const isGood = (zone) => (clues && !props.revealed.solution.includes(zone)) || (kind === 'trap' && props.revealed.solution === 'safe')
  return [...props.revealed.notes]
    .sort((a, b) => rank(a.zone) - rank(b.zone))
    .map((note, i) => {
      const good = isGood(note.zone)
      const status = zoneStatus(note.zone, {
        solution: clues ? props.revealed.solution : null,
        picked: clues ? props.revealed.answer || [] : null,
        noted: true,
        reassuring: good,
      })
      return { ...note, number: i + 1, good, status, label: ZONE_STATUS_LABELS[status] || null }
    })
})

const marks = computed(() => Object.fromEntries(notes.value.map((note) => [note.zone, { number: note.number, good: note.good }])))

const mode = computed(() => {
  if (props.revealed) return 'review'
  return props.question.kind === 'clues' && !props.locked ? 'pick' : 'read'
})

const full = ref(false)
function onFull() {
  full.value = true
  setTimeout(() => (full.value = false), 2400)
}

const remaining = computed(() => (props.question.pick || 0) - zones.value.length)

// Les touches 1 à 4 choisissent une réponse.
function onKey(event) {
  if (answered.value || props.locked || event.target.closest?.('input, textarea')) return
  const index = Number(event.key) - 1
  if (Number.isInteger(index) && options.value[index]) pick(options.value[index].value)
}

defineExpose({ onKey })
</script>

<template>
  <section class="cl-exercise" :class="`cl-exercise--${question.kind}`">
    <p v-if="review" class="cl-new-word"><span aria-hidden="true">✦</span> Corrigeons tes erreurs</p>
    <!-- En vrai ou faux, la consigne est l'affirmation elle-même : on dit ce qu'on attend. -->
    <p v-if="statement" class="cl-kicker">Vrai ou faux ?</p>
    <h1>{{ statement ? `« ${statement} »` : typo(question.prompt) }}</h1>

    <div v-if="speech" class="cl-word-prompt">
      <img :src="gangImage(guest.id).src" :alt="guest.look || guest.name" class="cl-guest" />
      <p class="cl-speech"><span class="visually-hidden">{{ guest.name }} : </span>{{ speech }}</p>
    </div>

    <div v-if="question.artifact" class="cl-object">
      <ArtifactView
        ref="artifactView"
        :selected="zones"
        :artifact="question.artifact"
        :mode="mode"
        :pick="question.pick || 0"
        :marks="marks"
        :solution="question.kind === 'clues' && revealed ? revealed.solution : null"
        :picked="question.kind === 'clues' && revealed ? revealed.answer || [] : null"
        :guest-name="guest.name"
        @update:selected="pick"
        @full="onFull"
      />
    </div>

    <p v-if="question.kind === 'clues' && !revealed" class="cl-count" aria-live="polite">
      <template v-if="full">Tu as déjà choisi {{ question.pick }} indices : touche-en un pour le retirer.</template>
      <template v-else-if="remaining > 0">{{ zones.length }} sur {{ question.pick }} : encore {{ remaining }} à toucher dans le document.</template>
      <template v-else>Tes {{ question.pick }} indices sont choisis. Valide !</template>
    </p>

    <div v-if="options.length" class="cl-word-options" :class="{ 'cl-word-options--two': options.length === 2 }" role="radiogroup" :aria-label="typo(question.prompt)">
      <button
        v-for="(option, index) in options"
        :key="String(option.value)"
        type="button"
        role="radio"
        class="cl-option"
        :class="optionState(option.value)"
        :aria-checked="(revealed ? revealed.answer : choice) === option.value"
        :disabled="locked || answered"
        @click="pick(option.value)"
      >
        <kbd>{{ index + 1 }}</kbd>
        <span class="cl-option-text">
          <strong v-if="option.hint">{{ option.label }}</strong>
          <template v-else>{{ option.label }}</template>
          <small v-if="option.hint">{{ option.hint }}</small>
        </span>
      </button>
    </div>

    <ol v-if="notes.length" class="cl-notes" aria-label="Les annotations du prof">
      <li v-for="note in notes" :key="note.zone" :class="note.status">
        <span class="cl-note-number" aria-hidden="true">{{ note.number }}</span>
        <p>
          <strong v-if="note.label" class="cl-note-label">{{ note.label }}</strong>
          {{ typo(note.text) }}
        </p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.cl-exercise {
  margin-top: 8px;
}

.cl-new-word {
  color: var(--beak-ink);
}

.cl-new-word span {
  background: var(--beak);
}

.cl-word-prompt {
  height: auto;
  min-height: 112px;
  margin-top: 20px;
}

.cl-guest {
  flex-shrink: 0;
  width: 96px;
  height: 112px;
  object-fit: contain;
  object-position: bottom;
}

.cl-speech {
  font-size: 18px;
}

.cl-object {
  display: grid;
  justify-items: center;
  margin-top: 24px;
}

.cl-object :deep(.artifact) {
  width: 100%;
  max-width: 460px;
}

.cl-count {
  margin-top: 16px;
  text-align: center;
  font-weight: 700;
  color: var(--toque-bright);
}

/* Au-dessus d'une affirmation : ce qu'on attend du joueur. */
.cl-kicker {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--toque-bright);
}

.cl-word-options--two {
  grid-template-columns: 1fr 1fr;
}

.cl-app .cl-word-options .cl-option {
  min-height: 64px;
}

.cl-option-text {
  display: grid;
}

.cl-option-text strong {
  font-size: 20px;
}

.cl-option-text small {
  font-size: 15px;
}

.cl-app .cl-option:disabled {
  cursor: default;
}

.cl-app .cl-option.selected kbd {
  color: var(--toque-bright);
  border-color: var(--toque-line);
}

.cl-app .cl-option.right {
  background: var(--success-pale);
  border-color: var(--success);
  color: var(--success-deep);
}

.cl-app .cl-option.wrong {
  background: var(--alert-pale);
  border-color: var(--alert);
  color: var(--alert-deep);
}

.cl-app .cl-option.dimmed {
  opacity: 0.45;
}

.cl-app .cl-option.selected small,
.cl-app .cl-option.right small,
.cl-app .cl-option.wrong small {
  color: inherit;
}

/* Les annotations du prof, numérotées comme sur l'objet. */
.cl-notes {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  padding: 0;
  list-style: none;
}

.cl-notes li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cl-notes p {
  margin: 0;
}

/* Le numéro reprend la couleur du passage sur le document (voir ArtifactView). */
.cl-note-number {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 24px;
  height: 24px;
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  background: var(--pen, var(--beak));
  border: 2px solid var(--pen, var(--beak));
  border-radius: 50%;
}

.cl-note-label {
  margin-right: 4px;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--pen-ink, var(--pen));
}

.cl-notes .hit {
  --pen: var(--success);
  --pen-ink: var(--success-ink);
}

.cl-notes .miss {
  --pen: var(--alert);
  --pen-ink: var(--alert-ink);
}

/* Un indice non touché : numéro cerclé de vert, comme les pointillés sur le document. */
.cl-notes .other {
  --pen: var(--success);
  --pen-ink: var(--success-ink);
}

.cl-notes .other .cl-note-number {
  color: var(--success-ink);
  background: #fff;
  border-style: dashed;
}

.cl-notes .aside {
  --pen: #8a90a6;
  --pen-ink: #5d6378;
}

.cl-notes .alert {
  --pen: var(--beak);
}

.cl-notes .good {
  --pen: var(--toque-bright);
}

@media (max-width: 699px) {
  .cl-exercise {
    margin-top: 8px;
  }

  .cl-word-prompt {
    min-height: 0;
    gap: 14px;
    margin-top: 14px;
  }

  .cl-guest {
    width: 64px;
    height: 76px;
  }

  .cl-speech {
    font-size: 16px;
    line-height: 22px;
    padding: 10px 14px;
  }

  .cl-object {
    margin-top: 16px;
  }

  .cl-app .cl-word-options .cl-option {
    min-height: 56px;
  }

  .cl-word-options kbd {
    display: none;
  }
}
</style>
