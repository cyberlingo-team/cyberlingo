<script setup>
// Le chemin d'apprentissage : les thèmes les uns sous les autres, et dans chaque thème ses
// étapes en zigzag (leçons, coffre, bilan). Toucher une étape ouvre une bulle qui dit quoi faire.
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

// Le décalage horizontal de chaque étape, en pixels : le chemin serpente.
const OFFSETS = [0, -48, -76, -48, 0, 48, 76, 48]
const offset = (unitIndex, index) => OFFSETS[index % OFFSETS.length] * (unitIndex % 2 ? -1 : 1)

const open = ref(null)
const opening = ref(false)
const root = ref(null)

const lessonCount = (unit) => unit.nodes.filter((node) => node.type === 'lesson').length
const lessonNumber = (unit, node) => unit.nodes.filter((n) => n.type === 'lesson').indexOf(node) + 1

function toggle(node) {
  open.value = open.value === node.id ? null : node.id
}

function popover(unit, node) {
  if (node.type === 'chest') {
    if (node.status === 'current') return { title: 'Un coffre !', text: 'Il contient des sardines pour la boutique.', action: 'Ouvrir le coffre' }
    if (node.status === 'done') return { title: 'Coffre ouvert', text: 'Tu as déjà récupéré ses sardines.' }
    return { title: 'Coffre fermé', text: 'Finis les leçons d’avant pour l’ouvrir.' }
  }
  const review = node.type === 'review'
  const title = typo(node.title)
  const where = review ? `Une question de chaque leçon du thème` : `Leçon ${lessonNumber(unit, node)} sur ${lessonCount(unit)}${node.guest ? ` · avec ${node.guest.name}` : ''}`
  if (node.status === 'current') return { title, text: where, action: review ? 'Passer le bilan' : 'Commencer', gain: `Jusqu’à +${plural(node.maxPoints, 'point')}` }
  if (node.status === 'done') {
    const score = node.score ? `${node.score.correct}/${node.score.total} bonnes réponses. ` : ''
    return { title, text: `${score}Rejouer ne rapporte pas de points.`, action: 'Rejouer' }
  }
  return { title, text: 'Finis les étapes d’avant pour débloquer celle-ci.' }
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
    open.value = null
    emit('changed')
  } catch (error) {
    showFlash(error.message)
  } finally {
    opening.value = false
  }
}

function onDocumentClick(event) {
  if (open.value && !event.target.closest?.('.step')) open.value = null
}

function onKey(event) {
  if (event.key === 'Escape') open.value = null
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
  // On arrive sur l'étape à jouer, sauf tout en haut du chemin.
  nextTick(() => {
    const current = root.value?.querySelector('.step.is-current')
    if (!current || props.path.current?.id === props.path.units[0]?.nodes[0]?.id) return
    current.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' })
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})

const finished = computed(() => !props.path.current)
</script>

<template>
  <div ref="root" class="path">
    <section
      v-for="(unit, unitIndex) in path.units"
      :key="unit.id"
      class="unit"
      :class="[`unit--${unit.status}`, unitIndex % 2 ? 'unit--odd' : 'unit--even']"
      :style="unitStyle(unit.color)"
      :aria-labelledby="`unit-${unit.id}`"
    >
      <header class="unit-band">
        <div class="unit-text">
          <p class="kicker unit-kicker">Thème {{ unit.number }}</p>
          <h2 :id="`unit-${unit.id}`" class="unit-title">{{ typo(unit.title) }}</h2>
          <p class="unit-description">{{ typo(unit.description) }}</p>
        </div>
        <RouterLink :to="`/apprendre/${unit.id}/guide`" class="unit-guide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10.2 5 7.6 4.5 4 4.7v13.6c3.6-.2 6.2.3 8 1.8 1.8-1.5 4.4-2 8-1.8V4.7c-3.6-.2-6.2.3-8 1.8zM12 6.5v13.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /></svg>
          <span>Guide</span>
        </RouterLink>
      </header>

      <ol class="steps">
        <li
          v-for="(node, index) in unit.nodes"
          :key="node.id"
          class="step"
          :class="[`step--${node.type}`, `is-${node.status}`, { 'is-open': open === node.id }]"
          :style="{ '--x': `${offset(unitIndex, index)}px` }"
        >
          <span v-if="node.status === 'current' && open !== node.id" class="step-start" aria-hidden="true">{{ node.type === 'chest' ? 'Ouvrir' : 'Commencer' }}</span>

          <button
            type="button"
            class="step-button"
            :aria-expanded="open === node.id"
            :aria-label="`${typo(node.title)} : ${node.status === 'done' ? 'fait' : node.status === 'current' ? 'à faire maintenant' : 'verrouillé'}`"
            @click="toggle(node)"
          >
            <template v-if="node.type === 'chest'">
              <Icon :name="node.status === 'done' ? 'coffre-ouvert' : 'coffre'" :size="78" />
            </template>
            <template v-else-if="node.type === 'review'">
              <Icon name="trophee" :size="46" />
            </template>
            <svg v-else-if="node.status === 'done'" viewBox="0 0 24 24" class="step-glyph" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="node.status === 'current'" viewBox="0 0 24 24" class="step-glyph" aria-hidden="true">
              <path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="step-glyph" aria-hidden="true">
              <path d="M7 10V8a5 5 0 0 1 10 0v2h.5c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5h-11C5.7 20 5 19.3 5 18.5v-7C5 10.7 5.7 10 6.5 10zm2.5 0h5V8a2.5 2.5 0 0 0-5 0z" fill="currentColor" />
            </svg>
          </button>

          <div v-if="open === node.id" class="pop" :class="`pop--${node.status}`" role="dialog" :aria-label="popover(unit, node).title">
            <p class="pop-title">{{ popover(unit, node).title }}</p>
            <p class="pop-text">{{ popover(unit, node).text }}</p>
            <button v-if="popover(unit, node).action" type="button" class="button button--wide pop-action" :disabled="opening" @click="act(node)">
              {{ opening ? 'Ouverture…' : popover(unit, node).action }}
              <span v-if="popover(unit, node).gain" class="pop-gain">{{ popover(unit, node).gain }}</span>
            </button>
          </div>
        </li>
      </ol>

      <img :src="villainImage(unit.villain).src" alt="" class="unit-villain" :class="{ 'is-dim': unit.status === 'locked' }" />
    </section>

    <section v-if="finished" class="finished card card--pad">
      <Icon name="trophee" :size="72" />
      <h2 class="section-title">Parcours terminé !</h2>
      <p class="muted">Tu as fini les {{ path.lessons.total }} leçons. La mission du jour continue chaque matin, et tu peux rejouer n’importe quelle étape.</p>
    </section>
  </div>
</template>

<style scoped>
.path {
  display: grid;
  gap: 40px;
  padding-bottom: 40px;
}

.unit {
  position: relative;
  display: grid;
  gap: 28px;
}

/* --- Le bandeau du thème, qui reste en haut pendant qu'on descend dans ses étapes */

.unit-band {
  position: sticky;
  top: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px 16px 20px;
  color: #fff;
  background: var(--unit);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--unit-deep);
}

.unit-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.unit-kicker {
  opacity: 0.8;
}

.unit-title {
  font-size: 1.3rem;
}

.unit-description {
  font-size: 0.95rem;
  opacity: 0.92;
}

.unit-guide {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-small);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.15);
}

.unit-guide:hover {
  text-decoration: none;
  background: rgba(255, 255, 255, 0.12);
}

.unit-guide svg {
  width: 22px;
  height: 22px;
}

/* --- Les étapes */

.steps {
  display: grid;
  justify-items: center;
  gap: 22px;
  margin: 0;
  padding: 52px 0 0;
  list-style: none;
}

.step {
  position: relative;
  display: grid;
  justify-items: center;
  transform: translateX(var(--x));
}

.step.is-open {
  z-index: 6;
}

/* La place de la bulle « Commencer » au-dessus de l'étape à jouer. */
.step.is-current {
  margin-top: 40px;
}

.step-button {
  --face: var(--unit);
  --edge: var(--unit-deep);
  display: grid;
  place-items: center;
  width: 72px;
  height: 66px;
  padding: 0;
  color: #fff;
  background: var(--face);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 7px 0 var(--edge);
  transition:
    transform 0.08s,
    box-shadow 0.08s;
}

.step-button:active {
  transform: translateY(6px);
  box-shadow: 0 1px 0 var(--edge);
}

.step-glyph {
  width: 34px;
  height: 34px;
}

.step.is-locked .step-button {
  --face: #e5e8f0;
  --edge: #c8cdda;
  color: #aab0c2;
}

/* L'étape à jouer : un anneau autour, comme une cible. */
.step.is-current .step-button {
  outline: 7px solid var(--paper);
  box-shadow:
    0 7px 0 var(--edge),
    0 0 0 14px color-mix(in srgb, var(--unit) 22%, transparent);
}

.step.is-current .step-button:active {
  box-shadow:
    0 1px 0 var(--edge),
    0 0 0 14px color-mix(in srgb, var(--unit) 22%, transparent);
}

/* Le coffre et le bilan ne sont pas des boutons ronds comme les autres. */
.step--chest .step-button {
  width: 92px;
  height: 84px;
  background: none;
  box-shadow: none;
  border-radius: var(--radius);
}

.step--chest.is-current .step-button {
  outline: none;
  box-shadow: none;
  animation: wiggle 2.4s ease-in-out infinite;
}

.step--chest.is-locked .step-button :deep(img) {
  filter: grayscale(1) opacity(0.55);
}

.step--review .step-button {
  width: 88px;
  height: 80px;
}

.step--review.is-locked .step-button :deep(img) {
  filter: grayscale(1) opacity(0.5);
}

.step-start {
  position: absolute;
  bottom: calc(100% + 16px);
  z-index: 2;
  padding: 8px 14px;
  font-size: 0.88rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--unit);
  background: var(--paper);
  border: 2px solid var(--rule);
  border-radius: var(--radius-small);
  animation: bob 1.6s ease-in-out infinite;
}

.step-start::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 12px;
  height: 12px;
  background: var(--paper);
  border-right: 2px solid var(--rule);
  border-bottom: 2px solid var(--rule);
  transform: translate(-50%, -6px) rotate(45deg);
}

/* --- La bulle d'une étape */

.pop {
  position: absolute;
  top: calc(100% + 18px);
  left: 50%;
  z-index: 7;
  display: grid;
  gap: 6px;
  width: min(320px, calc(100vw - 48px));
  padding: 18px;
  color: #fff;
  background: var(--unit);
  border-radius: var(--radius);
  transform: translateX(calc(-50% - var(--x)));
  box-shadow: 0 10px 24px rgba(29, 34, 51, 0.18);
}

.pop::before {
  content: '';
  position: absolute;
  top: -8px;
  left: calc(50% + var(--x));
  width: 16px;
  height: 16px;
  background: inherit;
  transform: translateX(-50%) rotate(45deg);
}

.pop--locked {
  color: var(--muted);
  background: var(--wash);
  border: 2px solid var(--rule);
}

.pop--locked::before {
  border-top: 2px solid var(--rule);
  border-left: 2px solid var(--rule);
  top: -9px;
}

.pop-title {
  font-size: 1.15rem;
  font-weight: 800;
}

.pop--locked .pop-title {
  color: var(--ink);
}

.pop-text {
  font-size: 0.95rem;
  opacity: 0.92;
}

.pop-action {
  --face: var(--paper);
  --edge: rgba(0, 0, 0, 0.18);
  --text: var(--unit);
  margin-top: 8px;
  flex-direction: column;
  gap: 2px;
}

.pop-gain {
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

/* --- Léopold rôde le long du thème, déguisé. */

.unit-villain {
  position: absolute;
  top: 190px;
  width: auto;
  height: 210px;
  pointer-events: none;
}

.unit--even .unit-villain {
  right: 2%;
}

.unit--odd .unit-villain {
  left: 2%;
}

.unit-villain.is-dim {
  filter: grayscale(1) opacity(0.35);
}

.finished {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

@keyframes bob {
  50% {
    transform: translateY(-6px);
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

@media (max-width: 1159px) {
  .unit-band {
    top: calc(var(--topbar-height) + 10px);
  }
}

@media (max-width: 520px) {
  .unit-title {
    font-size: 1.15rem;
  }

  .unit-description {
    display: none;
  }

  .unit-villain {
    height: 150px;
    top: 150px;
  }

  .unit--even .unit-villain {
    right: -4px;
  }

  .unit--odd .unit-villain {
    left: -4px;
  }
}
</style>
