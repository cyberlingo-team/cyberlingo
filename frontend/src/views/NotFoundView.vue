<script setup>
// Une adresse qui ne mène nulle part : Tux le prof s'est perdu avec nous.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Balloon from '../components/comic/Balloon.vue'
import Picture from '../components/comic/Picture.vue'
import { sceneImage } from '../lib/images.js'

const props = defineProps({
  title: { type: String, default: 'Cette page n’existe pas' },
  text: { type: String, default: '' },
})

const route = useRoute()
const address = computed(() => route.fullPath)
</script>

<template>
  <div class="page lost">
    <div class="lost-scene panel">
      <Picture class="lost-image" :image="sceneImage('prof-lost')" alt="Tux le prof, perdu, une carte dépliée entre les ailes." eager />
      <Balloon class="lost-balloon" tail="left">
        Je cherche « <span class="lost-address">{{ address }}</span> » depuis tout à l’heure. Rien. Pas même un
        panneau.
      </Balloon>
    </div>
    <h1 class="page-title">{{ props.title }}</h1>
    <p class="lead">
      {{
        props.text ||
        'L’adresse est peut-être mal recopiée, ou la page a déménagé. Une adresse bizarre, c’est aussi le premier indice d’un piège : bon réflexe de vérifier.'
      }}
    </p>
    <div class="lost-actions">
      <RouterLink class="button" to="/">Voir l’épisode du jour</RouterLink>
      <RouterLink class="button button--paper" to="/episodes">Tous les épisodes</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.lost-scene {
  display: grid;
  grid-template-columns: minmax(120px, 220px) 1fr;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 0;
  background: var(--toque-pale);
  overflow: hidden;
}

.lost-image {
  align-self: end;
  margin-bottom: -4px;
}

.lost-balloon {
  max-width: 34ch;
}

.lost-address {
  font-family: var(--font-object);
  font-size: 0.92em;
  overflow-wrap: anywhere;
}

.lost-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 520px) {
  .lost-scene {
    grid-template-columns: 110px 1fr;
  }
}
</style>
