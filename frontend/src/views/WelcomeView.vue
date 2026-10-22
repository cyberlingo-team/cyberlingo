<script setup>
// L'arrivée d'un nouveau joueur : deux questions pour faire connaissance, puis Tux le prof
// présente la mission du jour et le chemin. Les réponses restent dans la page : aucune route ne
// les enregistre, elles ne servent qu'à adapter la présentation.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/app/Icon.vue'
import { getPath } from '../api/index.js'
import { sceneImage } from '../lib/images.js'

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

const step = ref(0)
const reason = ref(null)
const pace = ref(null)
const starting = ref(false)
const problem = ref('')

const STEPS = 3
const ready = computed(() => (step.value === 0 ? Boolean(reason.value) : step.value === 1 ? Boolean(pace.value) : true))
const prof = sceneImage('prof-reading')
const mission = sceneImage('mission')

const speech = computed(() => {
  if (step.value === 0) return 'Bienvenue ! Qu’est-ce qui t’amène ?'
  if (step.value === 1) return 'Combien de temps veux-tu y passer chaque jour ?'
  return null
})

function back() {
  if (step.value === 0) router.push('/')
  else step.value--
}

function next() {
  if (ready.value && step.value < STEPS - 1) step.value++
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
  <div class="welcome">
    <header class="welcome-top">
      <button type="button" class="welcome-back" :aria-label="step === 0 ? 'Revenir à l’accueil' : 'Question précédente'" @click="back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <div class="meter welcome-meter" role="progressbar" :aria-valuenow="step + 1" aria-valuemin="1" :aria-valuemax="STEPS" aria-label="Étapes de l’arrivée">
        <div class="meter-fill" :style="{ width: `${((step + 1) / STEPS) * 100}%` }"></div>
      </div>
    </header>

    <main id="contenu" class="welcome-main" tabindex="-1">
      <template v-if="speech">
        <div class="welcome-talk">
          <img :src="prof.src" alt="" class="welcome-prof" />
          <h1 class="welcome-bubble">{{ speech }}</h1>
        </div>

        <div v-if="step === 0" class="options options--grid" role="radiogroup" aria-label="Ce qui t’amène">
          <button
            v-for="item in REASONS"
            :key="item.id"
            type="button"
            role="radio"
            class="option"
            :class="{ 'is-chosen': reason === item.id }"
            :aria-checked="reason === item.id"
            @click="reason = item.id"
          >
            <Icon :name="item.icon" :size="44" />
            <span class="option-label">{{ item.label }}</span>
          </button>
        </div>

        <div v-else class="options" role="radiogroup" aria-label="Temps par jour">
          <button
            v-for="item in PACES"
            :key="item.minutes"
            type="button"
            role="radio"
            class="option option--row"
            :class="{ 'is-chosen': pace === item.minutes }"
            :aria-checked="pace === item.minutes"
            @click="pace = item.minutes"
          >
            <span class="option-label">{{ item.minutes }} min par jour</span>
            <span class="option-detail">{{ item.label }} · {{ item.detail }}</span>
          </button>
        </div>
      </template>

      <div v-else class="intro">
        <img :src="mission.src" alt="Tux le prof tient un calendrier coché." class="intro-image" />
        <h1 class="intro-title">Voilà comment ça marche</h1>
        <ul class="intro-list">
          <li><Icon name="flamme" :size="36" /><span><strong>La mission du jour</strong>, la même pour tout le monde, fait avancer ta série.</span></li>
          <li><Icon name="igloo" :size="36" /><span><strong>Le chemin</strong> te fait passer de thème en thème, à ton rythme{{ pace ? `, ${pace} minutes par jour` : '' }}.</span></li>
          <li><Icon name="haltere" :size="36" /><span><strong>Tes points</strong> font prendre du muscle à ton Tux.</span></li>
        </ul>
        <p v-if="problem" class="form-problem" role="alert">{{ problem }}</p>
      </div>
    </main>

    <footer class="welcome-foot">
      <div class="welcome-foot-inner">
        <template v-if="step < STEPS - 1">
          <button type="button" class="button welcome-next" :disabled="!ready" @click="next">Continuer</button>
        </template>
        <template v-else>
          <RouterLink to="/inscription" class="button button--ghost welcome-next">Créer un profil d’abord</RouterLink>
          <button type="button" class="button welcome-next" :disabled="starting" @click="start">
            {{ starting ? 'Un instant…' : 'Commencer ma première leçon' }}
          </button>
        </template>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.welcome-top {
  display: flex;
  align-items: center;
  gap: 18px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 24px var(--gutter) 8px;
}

.welcome-back {
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

.welcome-back:hover {
  color: var(--ink);
  background: var(--wash);
}

.welcome-back svg {
  width: 26px;
  height: 26px;
}

.welcome-meter {
  --meter: var(--success);
  flex: 1;
}

.welcome-main {
  flex: 1;
  display: grid;
  align-content: start;
  gap: 28px;
  width: min(640px, 100%);
  margin: 0 auto;
  padding: 32px var(--gutter);
}

.welcome-talk {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.welcome-prof {
  flex-shrink: 0;
  width: auto;
  height: 130px;
}

.welcome-bubble {
  position: relative;
  margin-bottom: 30px;
  padding: 14px 18px;
  font-size: 1.3rem;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.welcome-bubble::before {
  content: '';
  position: absolute;
  left: -9px;
  bottom: 20px;
  width: 14px;
  height: 14px;
  background: var(--paper);
  border-left: 2px solid var(--rule);
  border-bottom: 2px solid var(--rule);
  transform: rotate(45deg);
}

.options {
  display: grid;
  gap: 12px;
}

.options--grid {
  grid-template-columns: 1fr 1fr;
}

.option {
  --edge: var(--rule);
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 18px 14px;
  font-weight: 800;
  background: var(--paper);
  border: 2px solid var(--edge);
  border-radius: var(--radius);
  box-shadow: 0 3px 0 var(--edge);
}

.option:hover {
  background: var(--wash);
}

.option:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--edge);
}

.option--row {
  justify-items: start;
  gap: 2px;
  text-align: left;
}

.option-label {
  font-size: 1.05rem;
}

.option-detail {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--muted);
}

.option.is-chosen {
  --edge: var(--toque-line);
  color: var(--toque-bright);
  background: var(--toque-pale);
}

.intro {
  display: grid;
  justify-items: center;
  gap: 18px;
}

.intro-image {
  width: auto;
  height: 200px;
}

.intro-title {
  font-size: 1.7rem;
  color: var(--toque);
  text-align: center;
}

.intro-list {
  display: grid;
  gap: 14px;
  padding: 0;
  list-style: none;
}

.intro-list li {
  display: flex;
  align-items: center;
  gap: 14px;
}

.welcome-foot {
  position: sticky;
  bottom: 0;
  background: var(--paper);
  border-top: 2px solid var(--rule);
}

.welcome-foot-inner {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 20px var(--gutter);
}

.welcome-next {
  min-width: 200px;
}

@media (max-width: 640px) {
  .welcome-foot-inner {
    flex-direction: column-reverse;
    padding-block: 14px;
  }

  .welcome-next {
    width: 100%;
  }

  .welcome-prof {
    height: 96px;
  }

  .welcome-bubble {
    font-size: 1.1rem;
  }

  .options--grid {
    grid-template-columns: 1fr;
  }

  .option {
    grid-template-columns: auto 1fr;
    justify-items: start;
    align-items: center;
  }
}
</style>
