<script setup>
// Les compteurs du joueur, en haut de la colonne de droite (en haut de l'écran sur téléphone) :
// son Tux, sa série, ses sardines et ses bouées. Chacun ouvre une bulle qui l'explique.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import { inventory, loadInventory } from '../../lib/inventory.js'
import { session } from '../../lib/session.js'
import { stageImage } from '../../lib/images.js'
import { plural } from '../../lib/format.js'

loadInventory()

const data = computed(() => inventory.data)
const open = ref('')
const root = ref(null)

function toggle(name) {
  open.value = open.value === name ? '' : name
}
function onDocumentClick(event) {
  if (root.value && !root.value.contains(event.target)) open.value = ''
}
function onKey(event) {
  if (event.key === 'Escape') open.value = ''
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
  <div ref="root" class="cl-statusbar">
    <template v-if="data">
      <button type="button" class="tux" :aria-expanded="open === 'tux'" @click="toggle('tux')">
        <img :src="tux.src" alt="" />
        <span class="visually-hidden">Ton Tux : stade {{ data.stage.name }}, {{ plural(data.points, 'point') }}</span>
      </button>
      <button type="button" class="streak" :class="{ lit: data.streak.playedToday }" :aria-expanded="open === 'streak'" @click="toggle('streak')">
        <Icon name="flamme" :size="28" />{{ data.streak.current }}
        <span class="visually-hidden">jour{{ data.streak.current > 1 ? 's' : '' }} de série</span>
      </button>
      <button type="button" class="gems" :aria-expanded="open === 'sardines'" @click="toggle('sardines')">
        <Icon name="sardine" :size="34" />{{ data.sardines }}
        <span class="visually-hidden">sardines</span>
      </button>
      <button type="button" class="hearts" :aria-expanded="open === 'buoys'" @click="toggle('buoys')">
        <Icon name="bouee" :size="28" />{{ data.buoys.count }}
        <span class="visually-hidden">bouées sur {{ data.buoys.max }}</span>
      </button>

      <div v-if="open" class="cl-status-popover cl-popover">
        <template v-if="open === 'tux'">
          <img :src="stageImage(data.stage.level).src" alt="" />
          <h2>{{ data.stage.name }}</h2>
          <p>{{ plural(data.points, 'point') }}. Chaque point fait grossir les muscles de ton Tux.</p>
          <RouterLink class="cl-button" to="/mon-tux" @click="open = ''">Voir mon Tux</RouterLink>
        </template>
        <template v-else-if="open === 'streak'">
          <Icon name="flamme" :size="80" />
          <h2>{{ plural(data.streak.current, 'jour') }} de série</h2>
          <p v-if="!session.user">Crée ton profil : ta série compte dès ta première mission du jour.</p>
          <p v-else-if="data.streak.playedToday">Mission du jour faite. Reviens demain pour la prolonger.</p>
          <p v-else>Fais la mission du jour avant minuit pour {{ data.streak.current ? 'la prolonger' : 'la lancer' }}.</p>
          <p v-if="data.freezes.count">{{ plural(data.freezes.count, 'glaçon') }} en réserve pour couvrir un jour manqué.</p>
          <RouterLink v-if="!data.streak.playedToday" class="cl-button green" to="/mission-du-jour" @click="open = ''">Jouer la mission</RouterLink>
        </template>
        <template v-else-if="open === 'sardines'">
          <Icon name="sardine" :size="80" />
          <h2>{{ plural(data.sardines, 'sardine') }}</h2>
          <p>Gagne des sardines avec les leçons, les coffres et les quêtes.</p>
          <RouterLink class="cl-button" to="/boutique" @click="open = ''">Aller à la boutique</RouterLink>
        </template>
        <template v-else>
          <Icon name="bouee" :size="80" />
          <h2>{{ data.buoys.count === data.buoys.max ? 'Tes bouées sont au complet !' : `${data.buoys.count} bouée${data.buoys.count > 1 ? 's' : ''} sur ${data.buoys.max}` }}</h2>
          <p>Une erreur dans une leçon coûte une bouée. Elles se regonflent toutes cette nuit. La mission du jour, elle, n’en coûte jamais.</p>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cl-statusbar > button {
  color: var(--ink);
}

.cl-statusbar .tux img {
  width: 36px;
  height: 40px;
}

.cl-statusbar .streak {
  color: #9aa0b4;
}

.cl-statusbar .streak:not(.lit) :deep(.icon) {
  filter: grayscale(1);
  opacity: 0.55;
}

.cl-statusbar .streak.lit {
  color: var(--beak);
}

.cl-status-popover :deep(.icon) {
  display: block;
  margin: 10px auto 20px;
}

.cl-status-popover h2 {
  font-size: 22px;
}
</style>
