<script setup>
// Une question de leçon : la consigne, le personnage invité qui parle, l'objet à examiner et
// les réponses possibles. Le joueur choisit, puis valide en bas de l'écran (LessonFooter).
//   trap       « Piège » ou « Fiable »
//   truefalse  « Vrai » ou « Faux »
//   choice     une proposition parmi trois ou quatre
//   clues      toucher les indices dans l'objet
// Après la réponse, le même écran montre la correction : la bonne tuile, et les annotations
// numérotées du prof sur l'objet.
import { computed, nextTick, ref, watch } from 'vue'
import ArtifactView from '../artifacts/ArtifactView.vue'
import { gangImage } from '../../lib/images.js'
import { zonesOf } from '../../lib/zones.js'
import { typo } from '../../lib/format.js'

const props = defineProps({
  question: { type: Object, required: true },
  guest: { type: Object, required: true },
  // La réponse en cours : 'trap', true, l'id d'une option, ou la liste des zones touchées.
  choice: { default: null },
  revealed: { type: Object, default: null },
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['update:choice'])

const BINARY = {
  trap: [
    { value: 'trap', label: 'Piège', hint: 'C’est une arnaque' },
    { value: 'safe', label: 'Fiable', hint: 'On peut y aller' },
  ],
  truefalse: [
    { value: true, label: 'Vrai' },
    { value: false, label: 'Faux' },
  ],
}

const PROMPTS = {
  trap: 'Piège ou fiable ?',
  truefalse: 'Vrai ou faux ?',
  choice: 'Choisis la bonne réponse',
  clues: 'Touche les indices',
}

const tiles = computed(() => {
  const { kind, options } = props.question
  if (BINARY[kind]) return BINARY[kind]
  if (kind === 'choice') return options.map((option) => ({ value: option.id, label: typo(option.text) }))
  return []
})

const zones = computed(() => (Array.isArray(props.choice) ? props.choice : []))
const answered = computed(() => Boolean(props.revealed))

function pick(value) {
  if (props.locked || answered.value) return
  emit('update:choice', value)
}

function tileState(value) {
  const r = props.revealed
  if (!r) return props.choice === value ? 'is-chosen' : ''
  if (r.solution === value) return 'is-right'
  if (r.answer === value) return 'is-wrong'
  return 'is-dimmed'
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

// Au stylo bleu (« good ») : ce qui rassure, un détail qui n'était pas un indice, ou ce que le
// prof relève sur un message fiable.
const notes = computed(() => {
  if (!props.revealed?.notes) return []
  const { kind } = props.question
  const order = readingOrder.value.length ? readingOrder.value : zonesOf(props.question.artifact)
  const rank = (zone) => (order.includes(zone) ? order.indexOf(zone) : order.length)
  const solution = Array.isArray(props.revealed.solution) ? props.revealed.solution : []
  const isGood = (zone) => (kind === 'clues' && !solution.includes(zone)) || (kind === 'trap' && props.revealed.solution === 'safe')
  return [...props.revealed.notes].sort((a, b) => rank(a.zone) - rank(b.zone)).map((note, i) => ({ ...note, number: i + 1, good: isGood(note.zone) }))
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

// Les touches 1 à 4 choisissent une tuile.
function onKey(event) {
  if (answered.value || props.locked || event.target.closest?.('input, textarea')) return
  const index = Number(event.key) - 1
  if (Number.isInteger(index) && tiles.value[index]) pick(tiles.value[index].value)
}

defineExpose({ onKey })
</script>

<template>
  <div class="stage">
    <p class="kicker stage-kicker">{{ PROMPTS[question.kind] }}</p>
    <h1 class="stage-prompt">{{ typo(question.prompt) }}</h1>

    <div class="stage-talk">
      <img :src="gangImage(guest.id).src" :alt="guest.look || guest.name" class="stage-guest" />
      <div class="stage-bubble">
        <p class="stage-scene">{{ typo(question.scene) }}</p>
        <p v-if="question.line" class="stage-line"><span class="visually-hidden">{{ guest.name }} :</span>« {{ typo(question.line) }} »</p>
      </div>
    </div>

    <div v-if="question.artifact" class="stage-object">
      <ArtifactView
        ref="artifactView"
        :selected="zones"
        :artifact="question.artifact"
        :mode="mode"
        :pick="question.pick || 0"
        :marks="marks"
        :solution="question.kind === 'clues' && revealed ? revealed.solution : null"
        :picked="question.kind === 'clues' && revealed ? revealed.answer : null"
        :guest-name="guest.name"
        @update:selected="pick"
        @full="onFull"
      />
    </div>

    <p v-if="question.kind === 'clues' && !revealed" class="stage-count" aria-live="polite">
      <template v-if="full">Tu as déjà choisi {{ question.pick }} indices : touche-en un pour le retirer.</template>
      <template v-else-if="remaining > 0">{{ zones.length }} sur {{ question.pick }} : encore {{ remaining }} à toucher dans le document.</template>
      <template v-else>Tes {{ question.pick }} indices sont choisis. Valide !</template>
    </p>

    <div v-if="tiles.length" class="tiles" :class="`tiles--${question.kind}`" role="radiogroup" :aria-label="typo(question.prompt)">
      <button
        v-for="(tile, index) in tiles"
        :key="String(tile.value)"
        type="button"
        role="radio"
        class="tile"
        :class="tileState(tile.value)"
        :aria-checked="(revealed ? revealed.answer : choice) === tile.value"
        :disabled="locked || answered"
        @click="pick(tile.value)"
      >
        <span class="tile-key" aria-hidden="true">{{ index + 1 }}</span>
        <span class="tile-label">{{ tile.label }}</span>
        <span v-if="tile.hint" class="tile-hint">{{ tile.hint }}</span>
      </button>
    </div>

    <ol v-if="notes.length" class="notes" aria-label="Les annotations du prof">
      <li v-for="note in notes" :key="note.zone" class="note" :class="{ 'note--good': note.good }">
        <span class="note-number" aria-hidden="true">{{ note.number }}</span>
        <span>{{ typo(note.text) }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.stage {
  display: grid;
  gap: 18px;
}

.stage-kicker {
  color: var(--beak-ink);
}

.stage-prompt {
  margin-top: -10px;
  font-size: clamp(1.35rem, 3.6vw, 1.75rem);
}

/* Le personnage et sa bulle. */
.stage-talk {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.stage-guest {
  flex-shrink: 0;
  width: 96px;
  height: 104px;
  object-fit: contain;
  object-position: bottom;
}

.stage-bubble {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 4px;
  padding: 12px 16px;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.stage-bubble::before {
  content: '';
  position: absolute;
  left: -9px;
  bottom: 22px;
  width: 14px;
  height: 14px;
  background: var(--paper);
  border-left: 2px solid var(--rule);
  border-bottom: 2px solid var(--rule);
  transform: rotate(45deg);
}

.stage-scene {
  font-size: 0.92rem;
  color: var(--muted);
}

.stage-line {
  font-weight: 700;
}

.stage-object {
  display: grid;
  justify-items: center;
}

.stage-object :deep(.artifact) {
  width: 100%;
  max-width: 460px;
}

.stage-count {
  text-align: center;
  font-weight: 700;
  color: var(--toque);
}

/* Les tuiles de réponse : blanches à bord gris, bleues une fois choisies. */
.tiles {
  display: grid;
  gap: 10px;
}

.tiles--trap,
.tiles--truefalse {
  grid-template-columns: 1fr 1fr;
}

.tile {
  --edge: var(--rule);
  position: relative;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  min-height: 64px;
  padding: 12px 16px 12px 48px;
  font-weight: 700;
  text-align: center;
  background: var(--paper);
  border: 2px solid var(--edge);
  border-radius: var(--radius-small);
  box-shadow: 0 3px 0 var(--edge);
  transition:
    transform 0.08s,
    box-shadow 0.08s;
}

.tiles--choice .tile {
  justify-items: start;
  text-align: left;
}

.tiles--trap .tile,
.tiles--truefalse .tile {
  min-height: 88px;
  padding-left: 16px;
}

.tile:not(:disabled):hover {
  background: var(--wash);
}

.tile:not(:disabled):active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--edge);
}

.tile-key {
  position: absolute;
  left: 12px;
  top: 50%;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 0.8rem;
  color: #9aa0b4;
  border: 2px solid var(--rule);
  border-radius: 8px;
  transform: translateY(-50%);
}

.tiles--trap .tile-key,
.tiles--truefalse .tile-key {
  top: 10px;
  transform: none;
}

.tile-label {
  font-size: 1.05rem;
}

.tiles--trap .tile-label,
.tiles--truefalse .tile-label {
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tile-hint {
  font-size: 0.85rem;
  color: var(--muted);
}

.tile.is-chosen {
  --edge: var(--toque-line);
  color: var(--toque-bright);
  background: var(--toque-pale);
}

.tile.is-chosen .tile-key {
  color: var(--toque-bright);
  border-color: var(--toque-line);
}

.tile.is-right {
  --edge: #8fd6b2;
  color: var(--success-ink);
  background: var(--success-pale);
}

.tile.is-wrong {
  --edge: #f2aaa4;
  color: var(--alert-ink);
  background: var(--alert-pale);
}

.tile.is-dimmed {
  opacity: 0.5;
}

.tile:disabled {
  cursor: default;
}

/* Les annotations du prof, numérotées comme sur l'objet. */
.notes {
  display: grid;
  gap: 8px;
  padding: 0;
  list-style: none;
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.95rem;
}

.note-number {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
  font-weight: 900;
  color: #fff;
  background: var(--alert);
  border-radius: 50%;
}

.note--good .note-number {
  background: var(--toque-bright);
}

@media (max-width: 520px) {
  .stage-guest {
    width: 72px;
    height: 80px;
  }

  .tile-key {
    display: none;
  }

  .tile {
    padding-left: 16px;
  }
}
</style>
