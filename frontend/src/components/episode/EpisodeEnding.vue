<script setup>
// La fin de l'épisode : la moralité, l'escroc démasqué, les points, le Tux qui grandit, la
// place au classement et « À suivre ». Les invités y trouvent de quoi garder leurs points.
import { computed, onMounted, ref, watch } from 'vue'
import Balloon from '../comic/Balloon.vue'
import ErrorPanel from '../comic/ErrorPanel.vue'
import LoadingPanel from '../comic/LoadingPanel.vue'
import Picture from '../comic/Picture.vue'
import Stamp from '../comic/Stamp.vue'
import MuscleName from '../tux/MuscleName.vue'
import TapeGauge from '../tux/TapeGauge.vue'
import NextEpisode from './NextEpisode.vue'
import { getResult } from '../../api/index.js'
import { useResource } from '../../lib/resource.js'
import { sceneImage, stageImage, villainImage } from '../../lib/images.js'
import { formatDay, formatNumber, ordinal, plural, typo } from '../../lib/format.js'
import { playSound } from '../../lib/sound.js'
import { reducedMotion } from '../../lib/preferences.js'

const props = defineProps({
  date: { type: String, required: true },
  isToday: { type: Boolean, default: false },
  fresh: { type: Boolean, default: false },
})

const emit = defineEmits(['loaded', 'review'])

const { data: result, error, reload } = useResource(() => getResult(props.date))
const root = ref(null)

watch(result, (value) => {
  if (!value) return
  emit('loaded', value)
  if (props.fresh) {
    if (value.villain) setTimeout(() => playSound('unmask'), 200)
    if (leveledUp.value) setTimeout(() => playSound('grow'), 1200)
  }
})

onMounted(() => {
  if (props.fresh && root.value) {
    root.value.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }
})

const perfect = computed(() => result.value && result.value.correct === result.value.total)

const scoreLine = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.correct === r.total) return `Sans-faute : ${r.total} cases sur ${r.total}.`
  if (r.correct === 0) return `Aucune bonne réponse sur ${r.total}. Les explications sont là pour ça.`
  return `${r.correct} bonne${r.correct > 1 ? 's' : ''} réponse${r.correct > 1 ? 's' : ''} sur ${r.total}.`
})

const pointLines = computed(() => {
  const points = result.value?.points
  if (!points) return []
  const lines = [{ label: `Bonnes réponses`, value: points.answers }]
  if (points.perfect) lines.push({ label: 'Bonus sans-faute', value: points.perfect })
  if (points.streak) lines.push({ label: 'Bonus de série', value: points.streak })
  return lines
})

const player = computed(() => result.value?.player || null)
const leveledUp = computed(() => player.value && player.value.after.stage.level > player.value.before.stage.level)

const gauge = computed(() => {
  const p = player.value
  if (!p) return null
  const stage = p.after.stage
  if (!stage.next) return null
  return {
    from: stage.minPoints,
    to: stage.next.minPoints,
    before: leveledUp.value ? null : p.before.points,
    after: p.after.points,
    remaining: stage.next.minPoints - p.after.points,
    nextName: stage.next.name,
  }
})

const rank = computed(() => result.value?.rank || null)
const gained = computed(() => (rank.value && rank.value.previous ? rank.value.previous - rank.value.position : 0))
</script>

<template>
  <div ref="root" class="ending">
    <LoadingPanel v-if="!result && !error" label="Chargement de la fin de l’épisode" />
    <ErrorPanel v-else-if="error && !result" :error="error" :retry="reload" />

    <template v-else-if="result">
      <h2 class="visually-hidden">Fin de l’épisode {{ result.number }}</h2>

      <!-- Moralité -->
      <section class="moral" aria-labelledby="moral-title">
        <h3 id="moral-title" class="moral-title">Moralité</h3>
        <p class="moral-text">{{ typo(result.moral) }}</p>
      </section>

      <!-- L'escroc démasqué -->
      <section v-if="result.villain" class="unmask panel" aria-labelledby="unmask-title">
        <div class="unmask-art">
          <Picture
            class="unmask-image"
            :image="villainImage(result.villain.id)"
            :alt="`Léopold, le léopard de mer, déguisé ${result.villain.disguise}.`"
            eager
          />
          <Stamp class="unmask-stamp" tone="alert" :animate="fresh">Démasqué</Stamp>
        </div>
        <div class="unmask-text">
          <h3 id="unmask-title" class="unmask-title">C’était {{ result.villain.name }}, {{ result.villain.disguise }}.</h3>
          <Balloon tail="left" class="unmask-quip">{{ typo(result.villain.quip) }}</Balloon>
          <p class="muted">Léopard de mer, escroc à plein temps. Il revient souvent, jamais avec le même costume.</p>
        </div>
      </section>
      <section v-else class="unmask unmask--none panel">
        <Picture class="unmask-prof" :image="sceneImage('prof-reading')" alt="Tux le prof lit sa bande dessinée dans un fauteuil." />
        <p class="unmask-none-text">Pas d’escroc dans cet épisode : juste un bon réflexe à prendre avant qu’il serve.</p>
      </section>

      <!-- Le score et les points -->
      <section class="score panel" aria-labelledby="score-title">
        <div class="score-head">
          <h3 id="score-title" class="score-title">{{ scoreLine }}</h3>
          <Stamp v-if="perfect" tone="safe" :animate="fresh" class="score-stamp">Sans-faute</Stamp>
        </div>

        <template v-if="result.mode === 'counted'">
          <dl class="points">
            <div v-for="line in pointLines" :key="line.label" class="points-line">
              <dt>{{ line.label }}</dt>
              <dd>+{{ formatNumber(line.value) }}</dd>
            </div>
            <div class="points-line points-total">
              <dt>{{ isToday ? 'Gagnés aujourd’hui' : `Gagnés le ${formatDay(result.date)}` }}</dt>
              <dd>{{ plural(result.points.total, 'point') }}</dd>
            </div>
          </dl>
        </template>
        <p v-else-if="result.mode === 'practice'" class="score-note">
          Épisode rattrapé : il ne rapporte pas de points, mais les réflexes, eux, restent.
        </p>

        <!-- Le Tux grandit (épisode du jour, joueur connecté) -->
        <div v-if="player" class="growth" :class="{ 'growth--up': leveledUp }">
          <Picture
            class="growth-tux"
            :image="stageImage(player.after.stage.level)"
            :alt="`Ton Tux, stade ${player.after.stage.name}.`"
          />
          <div class="growth-text">
            <p v-if="leveledUp" class="growth-burst">Nouveau stade !</p>
            <p class="growth-title">
              <template v-if="leveledUp">Ton Tux passe <strong>{{ player.after.stage.name }}</strong>.</template>
              <template v-else>Ton Tux, {{ player.after.stage.name }}, prend {{ plural(result.points.total, 'point') }} de muscle.</template>
            </p>
            <template v-if="gauge">
              <TapeGauge
                :from="gauge.from"
                :to="gauge.to"
                :before="gauge.before"
                :after="gauge.after"
                :label="`Points de ton Tux : ${gauge.after} sur ${gauge.to}`"
              />
              <p>Encore {{ plural(gauge.remaining, 'point') }} avant le stade {{ gauge.nextName }}.</p>
            </template>
            <p v-else>Tu as atteint le dernier stade. Les arnaques n’ont qu’à bien se tenir.</p>
            <p class="growth-streak">
              Série : {{ plural(player.streak.current, 'jour') }} de suite<template v-if="player.streak.best > player.streak.current">
                (record : {{ plural(player.streak.best, 'jour') }})</template><template v-else-if="player.streak.current > 1"> : c’est ton record.</template>
            </p>
          </div>
        </div>
      </section>

      <!-- La place au classement -->
      <section v-if="rank" class="rank panel" aria-labelledby="rank-title">
        <h3 id="rank-title" class="rank-title">
          {{ ordinal(rank.position) }} <span class="rank-of">sur {{ formatNumber(rank.players) }} cette semaine</span>
        </h3>
        <p v-if="gained > 0">Tu gagnes {{ gained }} place{{ gained > 1 ? 's' : '' }} avec cet épisode.</p>
        <p v-if="rank.ahead" class="rank-ahead">
          Encore <strong>{{ plural(rank.ahead.gap + 1, 'point') }}</strong> et tu doubles
          <MuscleName :name="rank.ahead.username" :level="rank.ahead.level" class="rank-name" />
          ({{ ordinal(rank.ahead.rank) }}).
          <template v-if="rank.next && rank.ahead.gap + 1 <= rank.next.maxPoints">
            Demain, un épisode peut rapporter jusqu’à {{ plural(rank.next.maxPoints, 'point') }} : de quoi passer devant.
          </template>
          <template v-else-if="rank.next">
            Demain, un épisode peut rapporter jusqu’à {{ plural(rank.next.maxPoints, 'point') }}.
          </template>
        </p>
        <p v-else class="rank-ahead">Tu es en tête des 7 derniers jours. Reviens demain pour le rester.</p>
        <RouterLink to="/classement" class="rank-link">Voir le classement</RouterLink>
      </section>

      <!-- L'invité sans compte -->
      <section v-if="result.mode === 'guest'" class="guest panel" aria-labelledby="guest-title">
        <Picture class="guest-egg" :image="sceneImage('egg')" alt="Un œuf coiffé d’une toque, qui commence à se fendre." />
        <div class="guest-text">
          <h3 id="guest-title" class="guest-title">Ton Tux attend dans son œuf.</h3>
          <p>
            Crée ton compte maintenant : cet épisode te rapporte
            <strong>{{ plural(result.points.total, 'point') }}</strong>, ton Tux éclot et ta série commence aujourd’hui.
          </p>
          <div class="guest-actions">
            <RouterLink to="/inscription" class="button">Créer mon compte</RouterLink>
            <RouterLink to="/connexion" class="guest-login">J’ai déjà un compte</RouterLink>
          </div>
          <p class="muted guest-small">Un pseudo et un mot de passe suffisent. Ni adresse mail, ni numéro de téléphone.</p>
        </div>
      </section>

      <NextEpisode v-if="isToday && result.next" :next="result.next" />

      <!-- Pour aller plus loin -->
      <section class="sources" aria-labelledby="sources-title">
        <h3 id="sources-title" class="sources-title">Pour aller plus loin</h3>
        <ul class="sources-list">
          <li v-for="source in result.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }}</a>
          </li>
        </ul>
      </section>

      <div class="ending-actions">
        <button type="button" class="button button--paper" @click="emit('review')">Relire les cases</button>
        <RouterLink v-if="isToday" to="/episodes" class="ending-link">Rattraper un épisode passé</RouterLink>
        <RouterLink v-else to="/" class="ending-link">L’épisode du jour</RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ending {
  display: grid;
  gap: var(--gutter);
  scroll-margin-top: 12px;
}

/* Moralité : le grand récitatif final. */
.moral {
  display: grid;
  gap: 8px;
  padding: clamp(16px, 4vw, 28px);
  background: var(--caption);
  border: 4px solid var(--ink);
}

.moral-title {
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: 900;
  font-stretch: 120%;
  line-height: 1;
}

.moral-text {
  font-size: clamp(1.1rem, 3.6vw, 1.3rem);
  font-weight: 500;
  line-height: 1.45;
  max-width: 60ch;
}

/* Léopold démasqué. */
.unmask {
  display: grid;
  grid-template-columns: minmax(120px, 0.7fr) 1.3fr;
  align-items: center;
  gap: clamp(16px, 4vw, 36px);
  padding: clamp(14px, 3.4vw, 26px);
}

.unmask-art {
  position: relative;
  display: grid;
  place-items: center;
}

.unmask-image {
  width: auto;
  max-height: 300px;
}

.unmask-stamp {
  position: absolute;
  bottom: 18%;
  left: 50%;
  translate: -50% 0;
  font-size: clamp(1.5rem, 5.6vw, 2.2rem);
}

.unmask-text {
  display: grid;
  gap: 16px;
  justify-items: start;
}

.unmask-title {
  font-size: clamp(1.5rem, 5vw, 2.1rem);
  font-weight: 900;
}

.unmask-quip {
  margin-left: 22px;
  font-size: 1.05rem;
}

.unmask--none {
  grid-template-columns: minmax(100px, 0.5fr) 1.5fr;
}

.unmask-prof {
  width: 100%;
  max-width: 190px;
}

.unmask-none-text {
  font-size: 1.15rem;
}

/* Score et points. */
.score {
  display: grid;
  gap: 16px;
  padding: clamp(14px, 3.4vw, 26px);
}

.score-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 24px;
}

.score-title {
  font-size: clamp(1.35rem, 4.6vw, 1.8rem);
  font-weight: 850;
}

.score-stamp {
  font-size: 1.35rem;
}

.points {
  display: grid;
  gap: 4px;
  max-width: 420px;
}

.points-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.points-line dd {
  margin: 0 0 0 auto;
  font-family: var(--font-title);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.points-line dt {
  flex: 1;
  display: flex;
  gap: 8px;
}

/* Les pointillés qui mènent au nombre, comme sur un ticket de caisse. */
.points-line dt::after {
  content: '';
  flex: 1;
  border-bottom: 2px dotted var(--rule);
  transform: translateY(-5px);
}

.points-total {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 2px solid var(--ink);
  font-weight: 700;
}

.points-total dd {
  font-size: 1.2rem;
  color: var(--toque);
}

.score-note {
  padding-left: 12px;
  border-left: 4px solid var(--caption);
}

.growth {
  display: grid;
  grid-template-columns: minmax(110px, 0.55fr) 1.45fr;
  align-items: center;
  gap: clamp(14px, 3vw, 28px);
  padding-top: 16px;
  border-top: 2px dashed var(--rule);
}

.growth-tux {
  width: 100%;
  max-width: 220px;
}

.growth--up .growth-tux {
  animation: grow-up 0.9s cubic-bezier(0.2, 1.4, 0.4, 1) 0.4s both;
}

.growth-text {
  display: grid;
  gap: 10px;
}

.growth-burst {
  justify-self: start;
  padding: 4px 14px;
  font-family: var(--font-title);
  font-weight: 900;
  font-size: 1.3rem;
  font-stretch: 120%;
  background: var(--beak);
  border: 3px solid var(--ink);
  transform: rotate(-3deg);
}

.growth-title {
  font-family: var(--font-title);
  font-size: clamp(1.2rem, 4vw, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
}

.growth-streak {
  font-weight: 600;
}

@keyframes grow-up {
  from {
    transform: scale(0.6);
    opacity: 0.3;
  }
}

/* Classement. */
.rank {
  display: grid;
  gap: 8px;
  justify-items: start;
  padding: clamp(14px, 3.4vw, 26px);
}

.rank-title {
  font-size: clamp(2.2rem, 9vw, 3.4rem);
  font-weight: 900;
  font-stretch: 115%;
}

.rank-of {
  font-size: 1.05rem;
  font-weight: 600;
  font-stretch: 100%;
}

.rank-ahead {
  font-size: 1.08rem;
}

.rank-name {
  font-size: 1.15em;
}

.rank-link {
  font-weight: 700;
}

/* Invité sans compte. */
.guest {
  display: grid;
  grid-template-columns: minmax(100px, 0.5fr) 1.5fr;
  align-items: center;
  gap: clamp(14px, 3vw, 28px);
  padding: clamp(14px, 3.4vw, 26px);
  border-width: 4px;
  background: var(--caption-pale);
}

.guest-egg {
  width: 100%;
  max-width: 200px;
}

.guest-text {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.guest-title {
  font-size: clamp(1.5rem, 5vw, 2.1rem);
  font-weight: 900;
}

.guest-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 20px;
}

.guest-login {
  font-weight: 700;
}

.guest-small {
  font-size: 0.92rem;
}

/* Sources. */
.sources {
  display: grid;
  gap: 8px;
  padding: 4px 2px;
}

.sources-title {
  font-size: 1.2rem;
  font-weight: 800;
}

.sources-list {
  margin: 0;
  padding-left: 1.2em;
  display: grid;
  gap: 4px;
}

.ending-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 22px;
}

.ending-link {
  font-weight: 700;
}

@media (max-width: 560px) {
  .unmask,
  .unmask--none,
  .guest {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .unmask-image {
    max-height: 240px;
  }

  .unmask-text,
  .guest-text {
    justify-items: start;
    width: 100%;
  }

  .unmask-prof,
  .guest-egg {
    max-width: 150px;
  }

  .growth {
    grid-template-columns: 96px 1fr;
    align-items: start;
  }
}
</style>
