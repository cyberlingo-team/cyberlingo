<script setup>
// Une leçon du chemin (/lecon/:id) ou la mission du jour (/mission-du-jour), en plein écran :
// la barre de progression en haut, une question à la fois, la correction en bas, puis le bilan.
// Une leçon commencée reprend là où on l'a laissée ; une erreur coûte une bouée, sauf dans la
// mission du jour.
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/app/Icon.vue'
import StatePanel from '../components/app/StatePanel.vue'
import QuestionStage from '../components/lesson/QuestionStage.vue'
import LessonFooter from '../components/lesson/LessonFooter.vue'
import LessonResult from '../components/lesson/LessonResult.vue'
import { getTodayMission, sendAnswer, getResult, startLesson, sendLessonAnswer, getLessonResult } from '../api/index.js'
import { session } from '../lib/session.js'
import { refreshInventory } from '../lib/inventory.js'
import { playSound } from '../lib/sound.js'
import { reducedMotion } from '../lib/preferences.js'
import { typo } from '../lib/format.js'

const route = useRoute()
const router = useRouter()
const daily = computed(() => route.name === 'daily')

// loading, error, locked, missing, nobuoys, question, result
const phase = ref('loading')
const error = shallowRef(null)
const lesson = shallowRef(null)
const answers = reactive({})
const buoys = ref(null)
const current = ref(0)
const choice = ref(null)
const sending = ref(false)
const result = shallowRef(null)
const stage = ref(null)
const top = ref(null)

const questions = computed(() => lesson.value?.questions || [])
const question = computed(() => questions.value[current.value])
const revealed = computed(() => (question.value ? answers[question.value.id] || null : null))
const answeredCount = computed(() => questions.value.filter((q) => answers[q.id]).length)
const firstOpen = () => questions.value.findIndex((q) => !answers[q.id])

const ready = computed(() => {
  const q = question.value
  if (!q || choice.value === null) return false
  return q.kind === 'clues' ? Array.isArray(choice.value) && choice.value.length === q.pick : true
})

function setAnswers(list) {
  for (const key of Object.keys(answers)) delete answers[key]
  Object.assign(answers, list || {})
}

async function load() {
  phase.value = 'loading'
  error.value = null
  try {
    if (daily.value) {
      const data = await getTodayMission()
      const { mission } = data
      lesson.value = { kind: 'daily', date: mission.date, title: mission.title, guest: mission.guest, questions: mission.questions }
      setAnswers(data.progress.answers)
      if (data.progress.completed) return showResult()
    } else {
      const data = await startLesson(route.params.id)
      lesson.value = { ...data.lesson, replay: data.replay }
      setAnswers(data.progress.answers)
      buoys.value = data.buoys
      if (data.progress.completed) return showResult()
    }
    current.value = Math.max(0, firstOpen())
    choice.value = null
    phase.value = 'question'
  } catch (cause) {
    if (cause.code === 'lesson_locked') phase.value = 'locked'
    else if (cause.code === 'no_buoys') phase.value = 'nobuoys'
    else if (cause.code === 'lesson_not_found') phase.value = 'missing'
    else {
      error.value = cause
      phase.value = 'error'
    }
  }
}

async function check() {
  if (!ready.value || sending.value || revealed.value) return
  sending.value = true
  const q = question.value
  try {
    const answer = q.kind === 'clues' ? [...choice.value] : choice.value
    const data = daily.value ? await sendAnswer(lesson.value.date, q.id, answer) : await sendLessonAnswer(lesson.value.id, q.id, answer)
    answers[q.id] = { answer: data.answer, correct: data.correct, solution: data.solution, explanation: data.explanation, notes: data.notes, success: data.success }
    if (data.buoys) buoys.value = data.buoys
    playSound(data.correct ? 'correct' : 'wrong')
  } catch (cause) {
    // Déjà répondu ailleurs, plus de bouée : on recharge la leçon telle que le serveur la connaît.
    if (cause.code === 'no_buoys') phase.value = 'nobuoys'
    else if (cause.status === 409) load()
    else {
      error.value = cause
      phase.value = 'error'
    }
  } finally {
    sending.value = false
  }
}

function next() {
  const open = firstOpen()
  if (open < 0) return showResult()
  if (!daily.value && buoys.value && buoys.value.count < 1) {
    phase.value = 'nobuoys'
    return
  }
  current.value = open
  choice.value = null
  top.value?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

// Le bilan de la mission du jour et celui d'une leçon n'ont pas tout à fait la même forme.
function normalize(data) {
  if (daily.value) {
    return {
      kind: 'daily',
      title: data.title,
      correct: data.correct,
      total: data.total,
      mode: data.mode,
      points: data.points ? data.points.total : null,
      streak: data.player?.streak.current || null,
      player: data.player,
      moral: data.moral,
      sources: data.sources,
      villain: data.villain,
      rank: data.rank,
    }
  }
  return {
    kind: data.kind,
    title: data.title,
    correct: data.correct,
    total: data.total,
    mode: 'counted',
    firstTime: data.firstTime,
    points: data.points ? data.points.total : null,
    sardines: data.sardines,
    player: data.player,
    moral: data.moral,
    reflexes: data.reflexes,
    sources: data.sources,
    earned: data.quests,
  }
}

async function showResult() {
  phase.value = 'loading'
  try {
    const data = daily.value ? await getResult(lesson.value.date) : await getLessonResult(lesson.value.id)
    result.value = normalize(data)
    refreshInventory()
    phase.value = 'result'
    window.scrollTo({ top: 0 })
  } catch (cause) {
    error.value = cause
    phase.value = 'error'
  }
}

function close() {
  router.push('/apprendre')
}

function onKey(event) {
  if (phase.value !== 'question' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Enter' && !event.target.closest?.('button, a')) {
    event.preventDefault()
    if (revealed.value) next()
    else check()
    return
  }
  stage.value?.onKey(event)
}

onMounted(() => {
  load()
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

const nextLabel = computed(() => (firstOpen() < 0 ? 'Voir le bilan' : 'Continuer'))
</script>

<template>
  <div class="lesson" :class="`lesson--${phase}`">
    <LessonResult v-if="phase === 'result'" :result="result" @continue="close" />

    <template v-else>
      <header ref="top" class="lesson-top">
        <button type="button" class="lesson-close" aria-label="Quitter (ta progression est gardée)" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
        </button>
        <div
          class="meter lesson-meter"
          role="progressbar"
          :aria-valuenow="answeredCount"
          aria-valuemin="0"
          :aria-valuemax="questions.length || 1"
          aria-label="Questions répondues"
        >
          <div class="meter-fill" :data-empty="answeredCount === 0" :style="{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }"></div>
        </div>
        <p v-if="daily" class="lesson-badge lesson-badge--daily"><Icon name="flamme" :size="26" /><span>Mission du jour</span></p>
        <p v-else-if="buoys" class="lesson-badge" :class="{ 'is-empty': buoys.count < 1 }">
          <Icon name="bouee" :size="30" /><span>{{ buoys.count }}</span>
          <span class="visually-hidden">bouée{{ buoys.count > 1 ? 's' : '' }} sur {{ buoys.max }}</span>
        </p>
      </header>

      <main id="contenu" class="lesson-main" tabindex="-1">
        <StatePanel v-if="phase === 'loading'" label="On prépare la leçon…" />
        <StatePanel v-else-if="phase === 'error'" state="error" :error="error" :retry="load" />

        <div v-else-if="phase === 'locked' || phase === 'missing'" class="blocked">
          <Icon name="coffre" :size="110" />
          <h1 class="blocked-title">{{ phase === 'locked' ? 'Pas encore !' : 'Leçon introuvable' }}</h1>
          <p class="muted">{{ phase === 'locked' ? 'Cette étape se débloque quand tu as fini celles d’avant sur le chemin.' : 'Cette leçon n’existe pas, ou plus.' }}</p>
          <RouterLink to="/apprendre" class="button">Retour au chemin</RouterLink>
        </div>

        <div v-else-if="phase === 'nobuoys'" class="blocked">
          <Icon name="bouee" :size="120" />
          <h1 class="blocked-title">Plus de bouée !</h1>
          <p class="muted">Chaque erreur dans une leçon coûte une bouée. Elles se regonflent toutes cette nuit. La mission du jour, elle, ne coûte jamais de bouée.</p>
          <div class="blocked-actions">
            <RouterLink v-if="session.user" to="/boutique" class="button">Regonfler à la boutique</RouterLink>
            <RouterLink to="/mission-du-jour" class="button button--blue">Jouer la mission du jour</RouterLink>
            <RouterLink to="/apprendre" class="button button--ghost">Retour au chemin</RouterLink>
          </div>
        </div>

        <template v-else-if="phase === 'question' && question">
          <p v-if="lesson.replay" class="lesson-note">Tu rejoues cette leçon : elle ne rapporte pas de points, mais une erreur coûte quand même une bouée.</p>
          <p class="lesson-title">{{ daily ? 'Mission du jour' : lesson.kind === 'review' ? 'Bilan du thème' : lesson.unit.title }} · {{ typo(lesson.title) }}</p>
          <QuestionStage
            ref="stage"
            :key="question.id"
            v-model:choice="choice"
            :question="question"
            :guest="question.guest || lesson.guest"
            :revealed="revealed"
            :locked="sending"
          />
        </template>
      </main>

      <LessonFooter v-if="phase === 'question' && question" :question="question" :ready="ready" :sending="sending" :revealed="revealed" :next-label="nextLabel" @check="check" @next="next" />
    </template>
  </div>
</template>

<style scoped>
.lesson {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.lesson-top {
  display: flex;
  align-items: center;
  gap: 18px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 24px var(--gutter) 8px;
  scroll-margin-top: 0;
}

.lesson-close {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #9aa0b4;
  background: none;
  border: 0;
  border-radius: 50%;
}

.lesson-close:hover {
  color: var(--ink);
  background: var(--wash);
}

.lesson-close svg {
  width: 26px;
  height: 26px;
}

.lesson-meter {
  --meter: var(--success);
  flex: 1;
}

.lesson-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--toque-bright);
}

.lesson-badge.is-empty {
  color: #9aa0b4;
}

.lesson-badge--daily {
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--beak-ink);
}

.lesson-main {
  flex: 1;
  width: min(640px, 100%);
  margin: 0 auto;
  padding: 16px var(--gutter) 32px;
}

.lesson-title {
  margin-bottom: 14px;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--muted);
}

.lesson-note {
  margin-bottom: 14px;
  padding: 10px 14px;
  font-size: 0.92rem;
  color: var(--toque);
  background: var(--toque-pale);
  border-radius: var(--radius-small);
}

.blocked {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 48px 0;
  text-align: center;
}

.blocked-title {
  font-size: 1.8rem;
}

.blocked .muted {
  max-width: 42ch;
}

.blocked-actions {
  display: grid;
  gap: 12px;
  width: min(340px, 100%);
}

@media (max-width: 640px) {
  .lesson-top {
    padding-top: 14px;
    gap: 12px;
  }

  .lesson-badge--daily span {
    display: none;
  }
}
</style>
