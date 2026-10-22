<script setup>
// Les compteurs du joueur, en haut à droite sur ordinateur et en haut de l'écran sur téléphone :
// son Tux, sa série, ses sardines et ses bouées. Chacun ouvre une bulle qui l'explique.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import { inventory, loadInventory } from '../../lib/inventory.js'
import { session } from '../../lib/session.js'
import { stageImage } from '../../lib/images.js'
import { plural } from '../../lib/format.js'

loadInventory()

const data = computed(() => inventory.data)
const open = ref(null)
const root = ref(null)

function toggle(name) {
  open.value = open.value === name ? null : name
}

function onDocumentClick(event) {
  if (root.value && !root.value.contains(event.target)) open.value = null
}

function onKey(event) {
  if (event.key === 'Escape') open.value = null
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})

const tux = computed(() => stageImage(data.value?.stage.level ?? 0, { mini: true }))
</script>

<template>
  <div ref="root" class="stats" :class="{ 'is-loading': !data }">
    <template v-if="data">
      <div class="stat-wrap">
        <button type="button" class="stat stat--tux" :aria-expanded="open === 'tux'" @click="toggle('tux')">
          <img :src="tux.src" alt="" class="stat-tux" />
          <span class="visually-hidden">Ton Tux : stade {{ data.stage.name }}, {{ plural(data.points, 'point') }}</span>
        </button>
        <div v-if="open === 'tux'" class="bubble">
          <p class="bubble-title">{{ data.stage.name }} · {{ plural(data.points, 'point') }}</p>
          <p>Chaque point fait grossir les muscles de ton Tux.</p>
          <RouterLink class="bubble-link" to="/mon-tux" @click="open = null">Voir mon Tux</RouterLink>
        </div>
      </div>

      <div class="stat-wrap">
        <button
          type="button"
          class="stat stat--streak"
          :class="{ 'is-off': !data.streak.playedToday }"
          :aria-expanded="open === 'streak'"
          @click="toggle('streak')"
        >
          <Icon name="flamme" :size="26" />
          <span class="stat-value">{{ data.streak.current }}</span>
          <span class="visually-hidden">jour{{ data.streak.current > 1 ? 's' : '' }} de série</span>
        </button>
        <div v-if="open === 'streak'" class="bubble">
          <p class="bubble-title">{{ plural(data.streak.current, 'jour') }} de série</p>
          <p v-if="!session.user">Crée ton profil : ta série compte dès ta première mission du jour.</p>
          <p v-else-if="data.streak.playedToday">Mission du jour faite. Reviens demain pour la prolonger.</p>
          <p v-else>Fais la mission du jour avant minuit pour {{ data.streak.current ? 'la prolonger' : 'la lancer' }}.</p>
          <p v-if="data.freezes.count" class="bubble-note">
            <Icon name="glacon" :size="18" /> {{ plural(data.freezes.count, 'glaçon') }} en réserve
          </p>
        </div>
      </div>

      <div class="stat-wrap">
        <button type="button" class="stat stat--sardines" :aria-expanded="open === 'sardines'" @click="toggle('sardines')">
          <Icon name="sardine" :size="34" />
          <span class="stat-value">{{ data.sardines }}</span>
          <span class="visually-hidden">sardines</span>
        </button>
        <div v-if="open === 'sardines'" class="bubble">
          <p class="bubble-title">{{ plural(data.sardines, 'sardine') }}</p>
          <p>Gagne des sardines avec les leçons, les coffres et les quêtes.</p>
          <RouterLink class="bubble-link" to="/boutique" @click="open = null">Aller à la boutique</RouterLink>
        </div>
      </div>

      <div class="stat-wrap">
        <button type="button" class="stat stat--buoys" :aria-expanded="open === 'buoys'" @click="toggle('buoys')">
          <Icon name="bouee" :size="26" />
          <span class="stat-value">{{ data.buoys.count }}</span>
          <span class="visually-hidden">bouées sur {{ data.buoys.max }}</span>
        </button>
        <div v-if="open === 'buoys'" class="bubble bubble--end">
          <p class="bubble-title">{{ data.buoys.count }} bouée{{ data.buoys.count > 1 ? 's' : '' }} sur {{ data.buoys.max }}</p>
          <p>Une erreur dans une leçon coûte une bouée. Elles se regonflent toutes cette nuit.</p>
          <p class="muted">La mission du jour, elle, ne coûte jamais de bouée.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-height: 48px;
}

.stat-wrap {
  position: relative;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 10px;
  font-size: 1.05rem;
  font-weight: 800;
  background: none;
  border: 0;
  border-radius: var(--radius-small);
}

.stat:hover,
.stat[aria-expanded='true'] {
  background: var(--wash);
}

.stat-tux {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.stat--streak .stat-value {
  color: var(--beak-ink);
}

.stat--streak.is-off img {
  filter: grayscale(1) opacity(0.45);
}

.stat--streak.is-off .stat-value {
  color: #a3a8ba;
}

.stat--sardines .stat-value {
  color: var(--toque-bright);
}

.stat--buoys .stat-value {
  color: var(--alert);
}

.bubble {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  z-index: 30;
  display: grid;
  gap: 8px;
  width: min(300px, 80vw);
  padding: 16px 18px;
  font-size: 0.98rem;
  text-align: left;
  background: var(--paper);
  border: 2px solid var(--rule);
  border-radius: var(--radius);
  box-shadow: 0 10px 24px rgba(29, 34, 51, 0.12);
  transform: translateX(-50%);
}

.bubble--end {
  left: auto;
  right: 0;
  transform: none;
}

.bubble-title {
  font-size: 1.1rem;
  font-weight: 800;
}

.bubble-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--toque);
}

.bubble-link {
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (max-width: 1023px) {
  .stat-wrap:first-child .bubble {
    left: 0;
    transform: none;
  }
}
</style>
