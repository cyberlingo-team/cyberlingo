<script setup>
// Une leçon du chemin (/lecon/:id) ou la mission du jour (/mission-du-jour), en plein écran, sur
// le gabarit de la leçon de la copie de référence : la barre de progression en haut, une question
// à la fois, « Passer » ou « Valider » en bas, puis la correction. Les questions ratées reviennent
// à la fin (« Corrigeons tes erreurs ») avant le bilan.
// Une leçon commencée reprend là où on l'a laissée ; une erreur coûte une bouée, sauf dans la
// mission du jour et quand on corrige ses erreurs en fin de leçon.
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
import { sceneImage } from '../lib/images.js'
import { playSound } from '../lib/sound.js'

const route = useRoute()
const router = useRouter()
const daily = computed(() => route.name === 'daily')

// loading, error, locked, missing, question, result
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
const quit = ref(false)
const noBuoys = ref(false)
const quitImage = sceneImage('prof-facepalm').src

// La seconde chance : les questions ratées, rejouées sans compter, et leurs nouvelles réponses.
const review = ref(null)
const retried = reactive({})

const questions = computed(() => lesson.value?.questions || [])
const question = computed(() => (review.value ? questions.value.find((q) => q.id === review.value.ids[review.value.index]) : questions.value[current.value]))
const revealed = computed(() => {
  if (!question.value) return null
  return review.value ? retried[question.value.id] || null : answers[question.value.id] || null
})
const firstOpen = () => questions.value.findIndex((q) => !answers[q.id])
const missed = () => questions.value.filter((q) => answers[q.id] && !answers[q.id].correct).map((q) => q.id)

const total = computed(() => questions.value.length + (review.value?.ids.length || 0))
const done = computed(() => {
  const first = questions.value.filter((q) => answers[q.id]).length
  return review.value ? first + review.value.index + (revealed.value ? 1 : 0) : first
})

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
  review.value = null
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
    else if (cause.code === 'no_buoys') {
      phase.value = 'buoys'
      noBuoys.value = true
    } else if (cause.code === 'lesson_not_found') phase.value = 'missing'
    else {
      error.value = cause
      phase.value = 'error'
    }
  }
}

// La correction d'une question rejouée se fait ici : on connaît déjà la solution.
function retry(q, answer) {
  const first = answers[q.id]
  const correct = answer !== null && (q.kind === 'clues' ? answer.every((zone) => first.solution.includes(zone)) : answer === first.solution)
  retried[q.id] = { ...first, answer, correct }
  playSound(correct ? 'correct' : 'wrong')
}

// skip : le joueur passe la question (réponse null), elle compte comme une erreur.
async function check({ skip = false } = {}) {
  if ((!skip && !ready.value) || sending.value || revealed.value) return
  const q = question.value
  const answer = skip ? null : q.kind === 'clues' ? [...choice.value] : choice.value
  if (review.value) return retry(q, answer)
  sending.value = true
  try {
    const data = daily.value ? await sendAnswer(lesson.value.date, q.id, answer) : await sendLessonAnswer(lesson.value.id, q.id, answer)
    answers[q.id] = { answer: data.answer, correct: data.correct, solution: data.solution, explanation: data.explanation, notes: data.notes, success: data.success }
    if (data.buoys) buoys.value = data.buoys
    playSound(data.correct ? 'correct' : 'wrong')
  } catch (cause) {
    // Déjà répondu ailleurs, plus de bouée : on recharge la leçon telle que le serveur la connaît.
    if (cause.code === 'no_buoys') noBuoys.value = true
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
  choice.value = null
  window.scrollTo({ top: 0 })
  if (review.value) {
    if (review.value.index + 1 < review.value.ids.length) review.value.index++
    else showResult()
    return
  }
  const open = firstOpen()
  if (open >= 0) {
    if (!daily.value && buoys.value && buoys.value.count < 1) noBuoys.value = true
    else current.value = open
    return
  }
  const ids = missed()
  if (ids.length) review.value = { ids, index: 0 }
  else showResult()
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

function leave() {
  router.push('/apprendre')
}

function onKey(event) {
  if (phase.value !== 'question' || quit.value || noBuoys.value || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Enter' && !event.target.closest?.('button, a')) {
    event.preventDefault()
    if (revealed.value) next()
    else check()
    return
  }
  stage.value?.onKey(event)
}

const nextLabel = computed(() => {
  if (review.value) return review.value.index + 1 < review.value.ids.length ? 'Continuer' : 'Voir le bilan'
  return firstOpen() < 0 && !missed().length ? 'Voir le bilan' : 'Continuer'
})

// Le pied de page grandit avec la correction : la page garde de quoi défiler au-dessus.
const footerHeight = ref(140)
const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(([entry]) => (footerHeight.value = entry.target.offsetHeight))
function watchFooter(component) {
  observer?.disconnect()
  if (component?.$el) observer?.observe(component.$el)
}

onMounted(() => {
  load()
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  observer?.disconnect()
})
</script>

<template>
  <div class="cl-app cl-lesson" :style="{ paddingBottom: phase === 'question' ? `${footerHeight + 24}px` : undefined }">
    <LessonResult v-if="phase === 'result'" :result="result" @continue="leave" />

    <template v-else>
      <header class="cl-lesson-header">
        <button type="button" class="cl-back" aria-label="Quitter la leçon" @click="phase === 'question' ? (quit = true) : leave()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
        </button>
        <div class="cl-progress" role="progressbar" :aria-valuenow="done" aria-valuemin="0" :aria-valuemax="total || 1" aria-label="Avancée de la leçon">
          <div :style="{ width: `${(done / (total || 1)) * 100}%` }"></div>
        </div>
        <span v-if="daily" class="cl-daily-badge"><Icon name="flamme" :size="28" /><span class="cl-daily-label">Mission du jour</span></span>
        <span v-else-if="buoys" class="cl-hearts" :class="{ empty: buoys.count < 1 }">
          <Icon name="bouee" :size="30" />{{ buoys.count }}
          <span class="visually-hidden">bouée{{ buoys.count > 1 ? 's' : '' }} sur {{ buoys.max }}</span>
        </span>
      </header>

      <main id="contenu" class="cl-lesson-main" tabindex="-1">
        <StatePanel v-if="phase === 'loading'" label="On prépare la leçon…" />
        <StatePanel v-else-if="phase === 'error'" state="error" :error="error" :retry="load" />

        <section v-else-if="phase === 'locked' || phase === 'missing'" class="cl-blocked">
          <Icon name="coffre" :size="110" />
          <h1>{{ phase === 'locked' ? 'Pas encore !' : 'Leçon introuvable' }}</h1>
          <p>{{ phase === 'locked' ? 'Cette étape se débloque quand tu as fini celles d’avant sur le chemin.' : 'Cette leçon n’existe pas, ou plus.' }}</p>
          <RouterLink to="/apprendre" class="cl-button green">Retour au chemin</RouterLink>
        </section>

        <template v-else-if="phase === 'question' && question">
          <p v-if="lesson.replay" class="cl-lesson-note">Tu rejoues cette leçon : elle ne rapporte pas de points, mais une erreur coûte quand même une bouée.</p>
          <QuestionStage
            ref="stage"
            :key="`${review ? 'r' : 'q'}-${question.id}`"
            v-model:choice="choice"
            :question="question"
            :guest="question.guest || lesson.guest"
            :revealed="revealed"
            :locked="sending"
            :review="Boolean(review)"
          />
        </template>
      </main>

      <LessonFooter
        v-if="phase === 'question' && question"
        :ref="watchFooter"
        :question="question"
        :ready="ready"
        :sending="sending"
        :revealed="revealed"
        :next-label="nextLabel"
        :can-skip="!review"
        @check="check()"
        @skip="check({ skip: true })"
        @next="next"
      />
    </template>

    <div v-if="quit" class="cl-modal-backdrop" @click.self="quit = false">
      <section class="cl-dialog" role="dialog" aria-modal="true" aria-labelledby="quit-title">
        <img :src="quitImage" alt="" class="cl-dialog-image" />
        <h2 id="quit-title">Tu veux vraiment quitter ?</h2>
        <p>Tes réponses sont gardées : tu reprendras à la même question.</p>
        <button type="button" class="cl-button green" @click="quit = false">Continuer</button>
        <button type="button" class="cl-button" @click="leave">Quitter</button>
      </section>
    </div>

    <div v-if="noBuoys" class="cl-modal-backdrop">
      <section class="cl-dialog" role="dialog" aria-modal="true" aria-labelledby="buoys-title">
        <Icon name="bouee" :size="96" class="cl-dialog-icon" />
        <h2 id="buoys-title">Tu n’as plus de bouées</h2>
        <p>Chaque erreur dans une leçon coûte une bouée. Elles se regonflent toutes cette nuit. La mission du jour, elle, n’en coûte jamais.</p>
        <RouterLink v-if="session.user" to="/boutique" class="cl-button green">Regonfler à la boutique</RouterLink>
        <RouterLink to="/mission-du-jour" class="cl-button blue">Jouer la mission du jour</RouterLink>
        <button type="button" class="cl-button" @click="leave">Plus tard</button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cl-back {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #9aa0b4;
  background: none;
  border: 0;
}

.cl-back svg {
  width: 26px;
  height: 26px;
}

.cl-back:hover {
  color: var(--muted);
}

.cl-lesson-header {
  height: 96px;
}

.cl-progress {
  flex: 1;
}

.cl-hearts {
  color: var(--alert);
}

.cl-hearts.empty {
  color: #9aa0b4;
}

.cl-daily-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--beak-ink);
  white-space: nowrap;
}

.cl-lesson-main {
  width: 600px;
  max-width: calc(100% - 48px);
  margin: 0 auto;
}

.cl-lesson-main:focus {
  outline: none;
}

.cl-lesson-note {
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 15px;
  color: var(--beak-ink);
  background: var(--beak-pale);
  border-radius: 12px;
}

.cl-blocked {
  display: grid;
  justify-items: center;
  gap: 16px;
  margin-top: 48px;
  text-align: center;
}

.cl-blocked p,
.cl-dialog p {
  color: var(--muted);
}

.cl-dialog .cl-button {
  width: 100%;
}

.cl-dialog-image {
  width: 140px;
  height: 140px;
  margin: 0 auto;
  object-fit: contain;
}

.cl-dialog-icon {
  margin: 0 auto;
}

@media (max-width: 699px) {
  .cl-lesson-main {
    max-width: calc(100% - 32px);
  }

  .cl-daily-label {
    display: none;
  }
}
</style>
