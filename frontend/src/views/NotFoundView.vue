<script setup>
// Une adresse qui ne mène nulle part : Tux le prof s'est perdu avec nous.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/app/AppShell.vue'
import { sceneImage } from '../lib/images.js'

const props = defineProps({
  title: { type: String, default: 'Cette page n’existe pas' },
  text: { type: String, default: '' },
})

const route = useRoute()
const address = computed(() => route.fullPath)
const picture = sceneImage('prof-lost')
</script>

<template>
  <AppShell>
    <div class="lost">
      <div class="lost-talk">
        <img :src="picture.src" alt="Tux le prof, perdu, une carte dépliée entre les ailes." class="lost-image" />
        <p class="lost-bubble">
          Je cherche « <span class="lost-address">{{ address }}</span> » depuis tout à l’heure. Rien. Pas même un panneau.
        </p>
      </div>
      <h1 class="section-title">{{ props.title }}</h1>
      <p class="lost-text">
        {{
          props.text ||
          'L’adresse est peut-être mal recopiée, ou la page a déménagé. Une adresse bizarre, c’est aussi le premier indice d’un piège : bon réflexe de vérifier.'
        }}
      </p>
      <div class="lost-actions">
        <RouterLink class="button" to="/apprendre">Retour au chemin</RouterLink>
        <RouterLink class="button button--ghost" to="/mission-du-jour">Mission du jour</RouterLink>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.lost {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding-top: 24px;
  text-align: center;
}

.lost-talk {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.lost-image {
  width: auto;
  height: 220px;
}

.lost-bubble {
  position: relative;
  order: -1;
  max-width: 34ch;
  margin-bottom: 8px;
  padding: 12px 16px;
  font-weight: 700;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.lost-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 14px;
  height: 14px;
  background: var(--paper);
  border-right: 2px solid var(--rule);
  border-bottom: 2px solid var(--rule);
  transform: translate(-50%, -7px) rotate(45deg);
}

.lost-address {
  overflow-wrap: anywhere;
  color: var(--alert-ink);
}

.lost-text {
  max-width: 46ch;
  color: var(--muted);
}

.lost-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
</style>
