<script setup>
// Le chemin d'apprentissage, repris de la copie de référence : en haut, l'en-tête du thème qu'on
// regarde (avec son guide), puis chaque thème et ses étapes en zigzag (leçons, coffre, bilan),
// séparés par le titre du thème suivant. Toucher une étape ouvre une bulle qui dit quoi faire.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../app/Icon.vue'
import { openChest } from '../../api/index.js'
import { villainImage } from '../../lib/images.js'
import { unitStyle } from '../../lib/units.js'
import { setInventory } from '../../lib/inventory.js'
import { showFlash } from '../../lib/flash.js'
import { playSound } from '../../lib/sound.js'
import { reducedMotion } from '../../lib/preferences.js'
import { plural, typo } from '../../lib/format.js'

const props = defineProps({
  path: { type: Object, required: true },
})

const emit = defineEmits(['changed'])
const router = useRouter()

// Le décalage horizontal de chaque étape, en pixels : le chemin serpente, dans un sens pour les
// thèmes pairs et dans l'autre pour les impairs (l'illustration prend la place libre).
const OFFSETS = [0, -45, -70, -45, 0, 45, 70, 45]
const offset = (unitIndex, index) => OFFSETS[index % OFFSETS.length] * (unitIndex % 2 ? -1 : 1)

const active = ref(null)
const opening = ref(false)
const root = ref(null)

// Le thème affiché dans l'en-tête : celui qu'on est en train de regarder.
const seen = ref(props.path.current?.unit || props.path.units[0].id)
const header = computed(() => props.path.units.find((unit) => unit.id === seen.value) || props.path.units[0])

const lessonCount = (unit) => unit.nodes.filter((node) => node.type === 'lesson').length
const lessonNumber = (unit, node) => unit.nodes.filter((n) => n.type === 'lesson').indexOf(node) + 1

function toggle(node) {
  active.value = active.value === node.id ? null : node.id
}

function popover(unit, node) {
  if (node.type === 'chest') {
    if (node.status === 'current') return { title: 'Un coffre de récompenses', text: 'Il contient des sardines pour la boutique.', action: 'Ouvrir le coffre' }
    if (node.status === 'done') return { title: 'Coffre ouvert', text: 'Tu as déjà récupéré ses sardines.' }
    return { title: 'Un coffre de récompenses', text: 'Termine les étapes précédentes pour l’ouvrir.' }
  }
  const review = node.type === 'review'
  const title = typo(node.title)
  const where = review ? 'Le bilan du thème : une question de chaque leçon.' : `Leçon ${lessonNumber(unit, node)} sur ${lessonCount(unit)}${node.guest ? ` · avec ${node.guest.name}` : ''}`
  if (node.status === 'current') return { title, text: where, action: `${review ? 'Passer le bilan' : 'Commencer'} +${plural(node.maxPoints, 'point')}` }
  if (node.status === 'done') {
    const score = node.score ? `${node.score.correct}/${node.score.total} bonnes réponses. ` : ''
    return { title, text: `${score}Rejouer ne rapporte pas de points.`, action: 'Rejouer' }
  }
  return { title, text: 'Termine les étapes précédentes pour débloquer celle-ci.' }
}

async function act(node) {
  if (node.type !== 'chest') {
    router.push(`/lecon/${node.id}`)
    return
  }
  opening.value = true
  try {
    const result = await openChest(node.id)
    setInventory(result.inventory)
    playSound('grow')
    showFlash(`Coffre ouvert : +${plural(result.sardines, 'sardine')} !`)
    active.value = null
    emit('changed')
  } catch (error) {
    showFlash(error.message)
  } finally {
    opening.value = false
  }
}

function onDocumentClick(event) {
  if (active.value && !event.target.closest?.('.cl-path-node-wrap')) active.value = null
}

function onKey(event) {
  if (event.key === 'Escape') active.value = null
}

let observer
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
  // L'en-tête suit le thème qui occupe le haut de l'écran.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) seen.value = entry.target.dataset.unit
    },
    { rootMargin: '-130px 0px -80% 0px' },
  )
  root.value?.querySelectorAll('.cl-path-unit').forEach((section) => observer.observe(section))
  // On arrive sur l'étape à jouer, sauf tout en haut du chemin.
  nextTick(() => {
    const current = root.value?.querySelector('.cl-path-node.current')
    if (!current || props.path.current?.id === props.path.units[0]?.nodes[0]?.id) return
    current.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' })
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
  observer?.disconnect()
})

const finished = computed(() => !props.path.current)
</script>

<template>
  <div ref="root" class="cl-path">
    <header class="cl-unit-header" :style="unitStyle(header.color)">
      <div>
        <p class="cl-unit-kicker">Thème {{ header.number }}</p>
        <h2>{{ typo(header.title) }}</h2>
      </div>
      <RouterLink class="cl-button" :to="`/apprendre/${header.id}/guide`">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10.2 5 7.6 4.5 4 4.7v13.6c3.6-.2 6.2.3 8 1.8 1.8-1.5 4.4-2 8-1.8V4.7c-3.6-.2-6.2.3-8 1.8zM12 6.5v13.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /></svg>
        <span>Guide</span>
      </RouterLink>
    </header>

    <section
      v-for="(unit, u) in path.units"
      :key="unit.id"
      class="cl-path-unit"
      :class="{ first: u === 0, locked: unit.status === 'locked' }"
      :style="unitStyle(unit.color)"
      :data-unit="unit.id"
      :aria-label="`Thème ${unit.number} : ${typo(unit.title)}`"
    >
      <h2 v-if="u" class="cl-path-divider"><span>{{ typo(unit.title) }}</span></h2>
      <img :src="villainImage(unit.villain).src" alt="" class="cl-path-illustration" :class="{ left: u % 2 }" />

      <div class="cl-path-nodes">
        <div
          v-for="(node, i) in unit.nodes"
          :key="node.id"
          class="cl-path-node-wrap"
          :class="{ chest: node.type === 'chest', 'has-label': node.status === 'current' && i > 0 }"
          :style="{ left: `${offset(u, i)}px` }"
        >
          <div v-if="node.status === 'current' && active !== node.id" class="cl-start-label" aria-hidden="true">
            {{ node.type === 'chest' ? 'Ouvrir' : 'Commencer' }}
          </div>
          <div class="cl-node-ring" :class="{ visible: node.status === 'current' && node.type !== 'chest' }">
            <button
              type="button"
              class="cl-path-node"
              :class="{
                available: node.status !== 'locked',
                current: node.status === 'current',
                chest: node.type === 'chest',
                review: node.type === 'review',
              }"
              :aria-label="`${typo(node.title)} : ${node.status === 'done' ? 'fait' : node.status === 'current' ? 'à faire maintenant' : 'verrouillé'}`"
              :aria-expanded="active === node.id"
              @click="toggle(node)"
            >
              <Icon v-if="node.type === 'chest'" :name="node.status === 'done' ? 'coffre-ouvert' : 'coffre'" :size="78" />
              <Icon v-else-if="node.type === 'review'" name="trophee" :size="40" />
              <svg v-else-if="node.status === 'done'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <section v-if="active === node.id" class="cl-path-popover" :class="{ locked: node.status === 'locked' }" role="dialog" :aria-label="popover(unit, node).title">
            <h3>{{ popover(unit, node).title }}</h3>
            <p>{{ popover(unit, node).text }}</p>
            <button v-if="popover(unit, node).action" type="button" class="cl-button" :disabled="opening" @click="act(node)">
              {{ opening ? 'Ouverture…' : popover(unit, node).action }}
            </button>
            <button v-else type="button" class="cl-button" @click="active = null">Compris</button>
          </section>
        </div>
      </div>
    </section>

    <section v-if="finished" class="cl-next-chapter">
      <small>Bravo</small>
      <h2>Parcours terminé !</h2>
      <p>Tu as fini les {{ path.lessons.total }} leçons. La mission du jour continue chaque matin, et tu peux rejouer n’importe quelle étape.</p>
    </section>
  </div>
</template>

<style scoped>
/* L'en-tête du thème reste en haut pendant qu'on descend dans ses étapes. */
.cl-unit-header {
  position: sticky;
  top: 24px;
  background: var(--unit);
  transition: background-color 0.3s;
}

.cl-unit-kicker {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
}

.cl-app .cl-unit-header h2 {
  margin-top: 4px;
  font-size: 22px;
  line-height: 28px;
  color: #fff;
}

.cl-app .cl-unit-header .cl-button {
  color: #fff;
  background: transparent;
  border-color: color-mix(in srgb, var(--unit-deep) 70%, #000);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cl-unit-header .cl-button svg {
  width: 24px;
  height: 24px;
}

/* Les étapes prennent la couleur de leur thème. */
.cl-app .cl-path-node {
  color: #9aa0b4;
}

.cl-app .cl-path-node.available {
  color: #fff;
  background: var(--unit);
  border-bottom-color: var(--unit-deep);
}

.cl-app .cl-path-node.chest {
  background: none;
}

.cl-app .cl-path-node.review:not(.available) .icon {
  filter: grayscale(1);
  opacity: 0.6;
}

.cl-path-node svg {
  width: 38px;
  height: 38px;
}

.cl-app .cl-path-node.chest:not(.available) .icon {
  filter: grayscale(1);
  opacity: 0.7;
}

.cl-path-node.chest.current .icon {
  animation: wiggle 2.4s ease-in-out infinite;
}

.cl-node-ring.visible::before {
  border-top-color: var(--unit);
}

.cl-start-label {
  color: var(--unit);
  animation: bob 1.6s ease-in-out infinite;
}

.cl-path-popover {
  background: var(--unit);
}

.cl-app .cl-path-popover .cl-button {
  padding: 0 12px;
  color: var(--unit);
  white-space: nowrap;
}

/* La bulle « Commencer » d'une étape au milieu du thème ne doit pas recouvrir la précédente. */
.cl-path-node-wrap.has-label {
  margin-top: 44px;
}

.cl-app .cl-path-popover.locked {
  background: var(--wash);
  color: var(--muted);
  border: 2px solid var(--rule);
}

.cl-app .cl-path-popover.locked h3 {
  color: var(--ink);
}

.cl-app .cl-path-popover.locked .cl-button {
  color: var(--muted);
  background: transparent;
  border-color: var(--rule);
}

.cl-path-illustration {
  width: auto;
  object-fit: contain;
}

.cl-path-unit.first .cl-path-illustration {
  top: 120px;
}

.cl-path-unit.locked .cl-path-illustration {
  filter: grayscale(0.8);
  opacity: 0.45;
}

.cl-app .cl-path-divider {
  margin-top: 8px;
  text-align: center;
}

@keyframes bob {
  50% {
    transform: translate(-50%, -4px);
  }
}

@keyframes wiggle {
  0%,
  80%,
  100% {
    transform: rotate(0);
  }
  85% {
    transform: rotate(-6deg);
  }
  90% {
    transform: rotate(6deg);
  }
  95% {
    transform: rotate(-3deg);
  }
}

:global([data-motion='reduced']) .cl-start-label,
:global([data-motion='reduced']) .cl-path-node.chest.current .icon {
  animation: none;
}

@media (max-width: 1079px) {
  .cl-unit-header {
    top: 12px;
  }
}

@media (max-width: 699px) {
  .cl-unit-header {
    top: 72px;
  }

  .cl-app .cl-unit-header h2 {
    font-size: 18px;
    line-height: 24px;
  }

  .cl-unit-kicker {
    font-size: 12px;
  }

  .cl-app .cl-unit-header .cl-button {
    padding: 0 12px;
  }

  .cl-unit-header .cl-button span {
    display: none;
  }

  .cl-path-illustration {
    height: 200px;
    width: auto;
    right: 0;
  }

  .cl-path-illustration.left {
    left: 0;
  }
}
</style>
