<script setup>
// Le lecteur d'épisode : la couverture, puis les cases une à une, puis la fin. La planche en
// miniature (EpisodeStrip) suit la progression et permet de relire une case.
import { computed, nextTick, reactive, ref } from 'vue'
import EpisodeCover from './EpisodeCover.vue'
import EpisodeStrip from './EpisodeStrip.vue'
import QuestionCase from './QuestionCase.vue'
import EpisodeEnding from './EpisodeEnding.vue'
import { reducedMotion } from '../../lib/preferences.js'
import { typo } from '../../lib/format.js'

const props = defineProps({
  mission: { type: Object, required: true },
  progress: { type: Object, required: true },
  stats: { type: Object, default: null },
  isToday: { type: Boolean, default: false },
})

const emit = defineEmits(['finished', 'conflict'])

const questions = computed(() => props.mission.questions)
const total = computed(() => questions.value.length)
const answers = reactive({ ...props.progress.answers })
const answeredCount = computed(() => questions.value.filter((q) => answers[q.id]).length)
const completed = computed(() => answeredCount.value === total.value)
const firstOpen = () => questions.value.findIndex((q) => !answers[q.id])

const phase = ref(props.progress.completed ? 'ending' : 'cover')
const current = ref(Math.max(0, firstOpen()))
// Vrai quand la fin vient d'être atteinte pendant cette visite : on joue alors les animations.
const freshEnding = ref(false)
const top = ref(null)

const question = computed(() => questions.value[current.value])
// La dernière case répondue pendant cette visite ; les autres cases déjà jouées se relisent.
const lastAnswered = ref(-1)
const reviewing = computed(() => phase.value === 'case' && Boolean(answers[question.value.id]) && current.value !== lastAnswered.value)

function scrollToTop() {
  nextTick(() => {
    if (!top.value) return
    top.value.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    top.value.focus({ preventScroll: true })
  })
}

function start() {
  const open = firstOpen()
  current.value = open >= 0 ? open : 0
  phase.value = open >= 0 ? 'case' : 'ending'
  scrollToTop()
}

function onAnswered(questionId, result) {
  answers[questionId] = {
    answer: result.answer,
    correct: result.correct,
    solution: result.solution,
    explanation: result.explanation,
    notes: result.notes,
    success: result.success,
  }
  lastAnswered.value = current.value
}

function next() {
  const open = firstOpen()
  if (open >= 0) {
    current.value = open
    phase.value = 'case'
  } else {
    if (!freshEnding.value && lastAnswered.value >= 0) freshEnding.value = true
    phase.value = 'ending'
  }
  scrollToTop()
}

function select(index) {
  current.value = index
  phase.value = 'case'
  scrollToTop()
}

function showEnding() {
  phase.value = 'ending'
  scrollToTop()
}

function review() {
  select(0)
}

// Libellé du bouton sous la correction : on relit, on continue, ou on va à la fin.
const nextLabel = computed(() => {
  if (!reviewing.value) return ''
  const open = firstOpen()
  if (open < 0) return 'Revenir à la fin de l’épisode'
  return `Reprendre à la case ${open + 1}`
})
</script>

<template>
  <div class="player">
    <EpisodeCover
      v-if="phase === 'cover'"
      :mission="mission"
      :stats="stats"
      :mode="progress.mode"
      :is-today="isToday"
      :answered="answeredCount"
      @start="start"
    />

    <template v-else>
      <div ref="top" class="player-top" tabindex="-1">
        <p class="player-title">
          <span class="player-number">Épisode {{ mission.number }}</span>
          <span class="player-name">{{ typo(mission.title) }}</span>
        </p>
        <EpisodeStrip
          :questions="questions"
          :answers="answers"
          :current="current"
          :phase="phase"
          :completed="completed"
          @select="select"
          @ending="showEnding"
        />
      </div>

      <QuestionCase
        v-if="phase === 'case'"
        :key="question.id"
        :date="mission.date"
        :question="question"
        :guest="mission.guest"
        :index="current"
        :total="total"
        :revealed="answers[question.id] || null"
        :next-label="nextLabel"
        @answered="onAnswered"
        @next="next"
        @conflict="emit('conflict')"
      />

      <EpisodeEnding
        v-else
        :key="`fin-${mission.date}`"
        :date="mission.date"
        :is-today="isToday"
        :fresh="freshEnding"
        @loaded="(result) => emit('finished', result)"
        @review="review"
      />
    </template>
  </div>
</template>

<style scoped>
.player {
  display: grid;
  gap: var(--gutter);
}

.player-top {
  display: grid;
  gap: 8px;
  scroll-margin-top: 10px;
}

.player-top:focus {
  outline: none;
}

.player-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 12px;
  font-family: var(--font-title);
}

.player-number {
  font-weight: 600;
  color: var(--muted);
}

.player-name {
  font-size: clamp(1.4rem, 4.8vw, 1.9rem);
  font-weight: 900;
  font-stretch: 112%;
  line-height: 1.05;
}
</style>
