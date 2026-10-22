<script setup>
// Une adresse qui ne mène nulle part : Tux le prof s'est perdu avec nous. Sa bulle et les
// boutons reprennent ceux de l'arrivée, sur le modèle de la copie de référence.
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
    <div class="lost solo">
      <div class="cl-tux-message">
        <div class="cl-onboarding-duo">
          <img :src="picture.src" alt="Tux le prof, perdu, une carte dépliée entre les ailes." />
        </div>
        <p class="cl-speech">
          Je cherche « <span class="lost-address">{{ address }}</span> » depuis tout à l’heure. Rien. Pas même un panneau.
        </p>
      </div>
      <h1>{{ props.title }}</h1>
      <p class="lost-text">
        {{
          props.text ||
          'L’adresse est peut-être mal recopiée, ou la page a déménagé. Une adresse bizarre, c’est aussi le premier indice d’un piège : bon réflexe de vérifier.'
        }}
      </p>
      <div class="lost-actions">
        <RouterLink class="cl-button green" to="/apprendre">Retour au chemin</RouterLink>
        <RouterLink class="cl-button" to="/mission-du-jour">Mission du jour</RouterLink>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.lost {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 24px 0 40px;
  text-align: center;
}

/* La bulle au-dessus de Tux, sans le décalage vers le bas de l'écran d'arrivée. */
.lost .cl-tux-message {
  transform: none;
  margin-bottom: 16px;
}

.lost .cl-onboarding-duo {
  height: 220px;
}

.lost .cl-onboarding-duo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.lost .cl-speech {
  max-width: 340px;
  font-size: 18px;
  font-weight: 700;
}

.lost h1 {
  font-size: 28px;
}

.lost-address {
  overflow-wrap: anywhere;
  color: var(--alert-ink);
}

.lost-text {
  max-width: 46ch;
  font-size: 17px;
  color: var(--muted);
}

.lost-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 699px) {
  .lost .cl-onboarding-duo {
    height: 160px;
  }

  .lost-actions {
    flex-direction: column;
    align-self: stretch;
  }
}
</style>
