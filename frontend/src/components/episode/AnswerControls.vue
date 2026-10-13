<script setup>
// Les façons de répondre, selon la question :
//   trap       tamponner l'objet « Piège » ou « Fiable »
//   truefalse  « Vrai » ou « Faux »
//   choice     choisir une proposition, puis valider
//   clues      toucher les indices dans l'objet, puis valider
// Une fois la réponse donnée, les mêmes contrôles montrent ce qui a été choisi et ce qui était juste.
import { computed, ref } from 'vue'
import { typo } from '../../lib/format.js'

const props = defineProps({
  question: { type: Object, required: true },
  revealed: { type: Object, default: null },
  sending: { type: Boolean, default: false },
  selectedZones: { type: Array, default: () => [] },
})

const emit = defineEmits(['answer', 'clear'])

const option = ref(null)
const locked = computed(() => Boolean(props.revealed) || props.sending)

const BINARY = {
  trap: [
    { value: 'trap', label: 'Piège', tone: 'alert' },
    { value: 'safe', label: 'Fiable', tone: 'safe' },
  ],
  truefalse: [
    { value: true, label: 'Vrai', tone: 'ink' },
    { value: false, label: 'Faux', tone: 'ink' },
  ],
}

const binary = computed(() => BINARY[props.question.kind] || null)

function given(value) {
  return props.revealed && props.revealed.answer === value
}

function isSolution(value) {
  return props.revealed && props.revealed.solution === value
}

function chooseOption(id) {
  if (!locked.value) option.value = id
}

const chosenOption = computed(() => (props.revealed ? props.revealed.answer : option.value))
const remaining = computed(() => props.question.pick - props.selectedZones.length)
</script>

<template>
  <div class="controls">
    <!-- Piège ou fiable, vrai ou faux : un coup de tampon. -->
    <div v-if="binary" class="binary" role="group" :aria-label="question.prompt">
      <button
        v-for="choice in binary"
        :key="String(choice.value)"
        type="button"
        class="stamp-button"
        :class="[
          `stamp-button--${choice.tone}`,
          { 'is-given': given(choice.value), 'is-solution': isSolution(choice.value), 'is-dimmed': revealed && !given(choice.value) && !isSolution(choice.value) },
        ]"
        :disabled="locked"
        :aria-pressed="revealed ? given(choice.value) : undefined"
        @click="emit('answer', choice.value)"
      >
        <span class="stamp-button-ink">{{ choice.label }}</span>
        <span v-if="revealed && isSolution(choice.value)" class="stamp-button-mark">la bonne réponse</span>
        <span v-else-if="revealed && given(choice.value)" class="stamp-button-mark">ta réponse</span>
      </button>
    </div>

    <!-- Une proposition parmi trois ou quatre. -->
    <div v-else-if="question.kind === 'choice'" class="choices">
      <ul class="choice-list" role="radiogroup" :aria-label="question.prompt">
        <li v-for="item in question.options" :key="item.id">
          <button
            type="button"
            role="radio"
            class="choice"
            :class="{
              'is-chosen': chosenOption === item.id,
              'is-right': revealed && revealed.solution === item.id,
              'is-wrong': revealed && revealed.answer === item.id && !revealed.correct,
            }"
            :aria-checked="chosenOption === item.id"
            :disabled="locked"
            @click="chooseOption(item.id)"
          >
            <span class="choice-box" aria-hidden="true"></span>
            <span class="choice-text">{{ typo(item.text) }}</span>
            <span v-if="revealed && revealed.solution === item.id" class="choice-mark">la bonne réponse</span>
            <span v-else-if="revealed && revealed.answer === item.id" class="choice-mark">ta réponse</span>
          </button>
        </li>
      </ul>
      <button v-if="!revealed" type="button" class="button validate" :disabled="!option || sending" @click="emit('answer', option)">
        {{ sending ? 'Envoi…' : 'Valider ma réponse' }}
      </button>
    </div>

    <!-- Les indices se touchent dans l'objet ; ici, le compte et la validation. -->
    <div v-else-if="question.kind === 'clues' && !revealed" class="clues">
      <p class="clues-count" aria-live="polite">
        <template v-if="remaining > 0">
          {{ selectedZones.length }} indice{{ selectedZones.length > 1 ? 's' : '' }} sur {{ question.pick }} :
          encore {{ remaining }} à toucher dans {{ question.artifact ? 'le document' : 'la case' }}.
        </template>
        <template v-else>Tes {{ question.pick }} indices sont choisis.</template>
      </p>
      <div class="clues-actions">
        <button type="button" class="button validate" :disabled="remaining > 0 || sending" @click="emit('answer', [...selectedZones])">
          {{ sending ? 'Envoi…' : 'Valider mes indices' }}
        </button>
        <button v-if="selectedZones.length" type="button" class="text-button" :disabled="sending" @click="emit('clear')">Tout effacer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: grid;
  gap: 12px;
}

/* Les deux tampons. */
.binary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stamp-button {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  min-height: 76px;
  padding: 10px 8px;
  background: var(--paper);
  border: 3px solid var(--ink);
  color: var(--ink);
  transition:
    transform 0.08s,
    background-color 0.12s;
}

.stamp-button-ink {
  display: inline-block;
  padding: 0.12em 0.5em 0.06em;
  font-family: var(--font-title);
  font-size: clamp(1.45rem, 6vw, 1.9rem);
  font-weight: 900;
  font-stretch: 125%;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  line-height: 1;
  border: 3px solid currentColor;
  transform: rotate(-4deg);
}

.stamp-button--alert {
  color: var(--alert);
}

.stamp-button--safe {
  color: var(--toque);
}

.stamp-button:not(:disabled):hover {
  background: var(--caption-pale);
}

.stamp-button:not(:disabled):active {
  transform: translateY(2px);
}

.stamp-button:disabled {
  cursor: default;
}

.stamp-button.is-given {
  background: var(--caption-pale);
  border-width: 4px;
}

.stamp-button.is-dimmed {
  opacity: 0.4;
}

.stamp-button-mark {
  font-family: var(--font-hand);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
}

/* Les propositions. */
.choices {
  display: grid;
  gap: 12px;
}

.choice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.choice {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: start;
  gap: 4px 12px;
  padding: 11px 14px;
  text-align: left;
  background: var(--paper);
  border: 2px solid var(--ink);
  font-family: var(--font-hand);
  line-height: 1.38;
}

.choice:not(:disabled):hover {
  background: var(--caption-pale);
}

.choice:disabled {
  cursor: default;
}

.choice-box {
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--paper);
}

.choice.is-chosen {
  background: var(--caption);
  border-width: 3px;
  padding: 10px 13px;
}

.choice.is-chosen .choice-box {
  background: radial-gradient(var(--ink) 0 5px, var(--paper) 6px);
}

.choice.is-right {
  background: var(--toque-pale);
  border-color: var(--toque);
}

.choice.is-right .choice-box {
  background: var(--toque);
  border-color: var(--toque);
}

.choice.is-wrong {
  background: var(--alert-pale);
  border-color: var(--alert);
}

.choice.is-wrong .choice-text {
  text-decoration: line-through;
  text-decoration-color: var(--alert);
  text-decoration-thickness: 2px;
}

.choice.is-wrong .choice-box {
  background: var(--alert);
  border-color: var(--alert);
}

.choice-mark {
  grid-column: 2;
  font-size: 0.85rem;
  font-weight: 700;
}

.choice.is-right .choice-mark {
  color: var(--toque);
}

.choice.is-wrong .choice-mark {
  color: var(--alert);
}

.validate {
  justify-self: start;
}

/* Les indices. */
.clues {
  display: grid;
  gap: 10px;
}

.clues-count {
  font-weight: 600;
}

.clues-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
}

@media (max-width: 520px) {
  .validate {
    justify-self: stretch;
  }
}
</style>
