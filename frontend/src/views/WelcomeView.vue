<script setup>
// L'arrivée d'un nouveau joueur, sur le modèle de la copie de référence : Tux le prof se
// présente, pose deux questions pour faire connaissance, montre comment ça marche, puis lance
// la première leçon du chemin. L'étape est dans l'adresse (?etape=), pour que le bouton retour
// du navigateur fonctionne. Les réponses restent dans la page : aucune route ne les enregistre,
// elles ne servent qu'à adapter la présentation.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/app/Icon.vue'
import { getPath } from '../api/index.js'
import { sceneImage } from '../lib/images.js'

const route = useRoute()
const router = useRouter()

const REASONS = [
  { id: 'moi', icon: 'cible', label: 'Ne plus me faire avoir' },
  { id: 'proches', icon: 'bouee', label: 'Protéger mes proches' },
  { id: 'travail', icon: 'haltere', label: 'Pour mon travail' },
  { id: 'curiosite', icon: 'igloo', label: 'Par curiosité' },
]

const PACES = [
  { minutes: 5, label: 'Tranquille', detail: 'La mission du jour' },
  { minutes: 10, label: 'Régulier', detail: 'La mission et une leçon' },
  { minutes: 15, label: 'Motivé', detail: 'La mission et deux leçons' },
]

// 0 et 1 : Tux se présente, seul à l'écran. 2 et 3 : les questions. 4 : comment ça marche.
// 5 : en route pour la première leçon.
const LAST = 5
const step = computed(() => Math.max(0, Math.min(LAST, Number(route.query.etape) || 0)))
const solo = computed(() => step.value < 2 || step.value === LAST)

const reason = ref(null)
const pace = ref(null)
const starting = ref(false)
const problem = ref('')

const IMAGES = ['prof-magnifier', 'heros', 'prof-reading', 'prof-reading', 'mission', 'quetes']
const character = computed(() => sceneImage(IMAGES[step.value]))

const message = computed(() => {
  if (step.value === 0) return 'Salut, moi c’est Tux le prof !'
  if (step.value === 1) return 'Je vais t’apprendre à déjouer les arnaques en ligne. On y va ?'
  if (step.value === 2) return 'Qu’est-ce qui t’amène ?'
  if (step.value === 3) return 'Combien de temps veux-tu y passer chaque jour ?'
  if (step.value === 4) return 'Voilà comment ça marche !'
  return 'Prêt pour ta première leçon ? Elle dure deux minutes.'
})

const ready = computed(() => (step.value === 2 ? Boolean(reason.value) : step.value === 3 ? Boolean(pace.value) : true))

function go(target) {
  router.push({ query: target ? { etape: target } : {} })
}

function back() {
  if (step.value === 0) router.push('/')
  else go(step.value - 1)
}

function next() {
  if (!ready.value) return
  if (step.value === LAST) start()
  else go(step.value + 1)
}

// La première leçon à jouer, demandée au serveur : c'est l'étape en cours du chemin.
async function start() {
  starting.value = true
  problem.value = ''
  try {
    const path = await getPath()
    router.push(path.current?.type === 'lesson' ? `/lecon/${path.current.id}` : '/apprendre')
  } catch (error) {
    problem.value = error.unreachable ? 'Le serveur ne répond pas. Vérifie ta connexion à Internet, puis réessaie.' : error.message
    starting.value = false
  }
}
</script>

<template>
  <div class="cl-app cl-welcome">
    <header v-if="!solo" class="cl-progress-header">
      <button type="button" class="cl-back" :aria-label="'Revenir à l’étape précédente'" @click="back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <div class="cl-progress" role="progressbar" :aria-valuenow="step - 1" aria-valuemin="0" aria-valuemax="4" aria-label="Étapes de l’arrivée">
        <div :style="{ width: `${((step - 1) / 4) * 100}%` }"></div>
      </div>
    </header>
    <button v-else type="button" class="cl-back welcome-back" :aria-label="step === 0 ? 'Revenir à l’accueil' : 'Revenir à l’étape précédente'" @click="back">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>

    <main id="contenu" class="cl-welcome-body" :class="{ solo, wide: step === 2 }" tabindex="-1">
      <div class="cl-tux-message">
        <div class="cl-onboarding-duo" :class="{ 'intro-duo': solo }">
          <img :key="step" :src="character.src" alt="" />
        </div>
        <h1 class="cl-speech" aria-live="polite">{{ message }}</h1>
      </div>

      <div v-if="step === 2" class="cl-options two-columns" role="radiogroup" :aria-label="message">
        <button
          v-for="item in REASONS"
          :key="item.id"
          type="button"
          role="radio"
          class="cl-option"
          :class="{ selected: reason === item.id }"
          :aria-checked="reason === item.id"
          @click="reason = item.id"
        >
          <Icon :name="item.icon" :size="40" />
          <span><strong>{{ item.label }}</strong></span>
        </button>
      </div>

      <div v-else-if="step === 3" class="cl-options" role="radiogroup" :aria-label="message">
        <button
          v-for="item in PACES"
          :key="item.minutes"
          type="button"
          role="radio"
          class="cl-option goal"
          :class="{ selected: pace === item.minutes }"
          :aria-checked="pace === item.minutes"
          @click="pace = item.minutes"
        >
          <strong>{{ item.minutes }} min/jour</strong>
          <small>{{ item.label }} · {{ item.detail }}</small>
        </button>
      </div>

      <div v-else-if="step === 4" class="cl-overview">
        <div>
          <Icon name="flamme" :size="64" />
          <section>
            <h3>La mission du jour</h3>
            <p>La même pour tout le monde, cinq minutes : elle fait avancer ta série.</p>
          </section>
        </div>
        <div>
          <Icon name="igloo" :size="64" />
          <section>
            <h3>Le chemin</h3>
            <p>Des leçons courtes, de thème en thème, à ton rythme{{ pace ? ` : ${pace} minutes par jour` : '' }}.</p>
          </section>
        </div>
        <div>
          <Icon name="haltere" :size="64" />
          <section>
            <h3>Ton Tux</h3>
            <p>Chaque bonne réponse rapporte des points, et tes points lui font prendre du muscle.</p>
          </section>
        </div>
      </div>

      <p v-if="problem" class="cl-form-error welcome-problem" role="alert">{{ problem }}</p>
    </main>

    <footer class="cl-action-footer">
      <div>
        <RouterLink v-if="step === LAST" to="/inscription" class="cl-button welcome-profile">Créer un profil d’abord</RouterLink>
        <button type="button" class="cl-button green" :disabled="!ready || starting" @click="next">
          {{ step === LAST ? (starting ? 'Un instant…' : 'Commencer') : 'Continuer' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.cl-back {
  color: #9aa0b4;
  cursor: pointer;
}

.cl-back svg {
  width: 26px;
  height: 26px;
}

.welcome-back {
  position: absolute;
  top: 30px;
  left: 30px;
}

.cl-welcome {
  position: relative;
}

.cl-welcome-body:focus {
  outline: none;
}

.cl-onboarding-duo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom;
}

.cl-speech {
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
  color: var(--ink);
}

.cl-option.goal small {
  text-align: right;
}

/* Une bulle un peu plus large que celle de la copie de référence : nos phrases sont plus longues. */
.solo .cl-speech {
  max-width: 320px;
}

.cl-overview section {
  display: grid;
  gap: 4px;
}

.cl-overview :deep(.icon) {
  flex-shrink: 0;
}

.welcome-problem {
  margin-top: 24px;
  text-align: center;
}

.cl-action-footer > div {
  gap: 16px;
}

@media (max-width: 699px) {
  .welcome-back {
    top: 20px;
    left: 16px;
  }

  .cl-action-footer > div {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .welcome-profile {
    display: none;
  }

  .cl-option.goal {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 2px;
  }

  .cl-option.goal small {
    text-align: left;
    font-size: 15px;
  }
}
</style>
