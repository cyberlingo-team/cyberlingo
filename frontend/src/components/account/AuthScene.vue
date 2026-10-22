<script setup>
// L'écran plein des formulaires de compte, sur le modèle de la copie de référence : une croix
// pour fermer en haut à gauche, le lien vers l'autre formulaire en haut à droite, puis le
// panneau centré avec son titre.
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  // Le bouton du coin : l'autre formulaire (connexion ou inscription).
  switchTo: { type: [String, Object], required: true },
  switchLabel: { type: String, required: true },
  // Où mène la croix.
  close: { type: String, default: '/' },
})

const router = useRouter()
</script>

<template>
  <div class="cl-app cl-auth">
    <button type="button" class="cl-auth-close" aria-label="Fermer" @click="router.push(close)">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
    </button>
    <RouterLink class="cl-button cl-auth-switch" :to="switchTo">{{ switchLabel }}</RouterLink>
    <main id="contenu" class="cl-auth-panel" tabindex="-1">
      <h1>{{ title }}</h1>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.cl-auth {
  position: relative;
  min-height: 100dvh;
}

.cl-auth-close {
  color: #9aa0b4;
}

.cl-auth-close:hover {
  color: var(--ink);
}

.cl-auth-close svg {
  width: 16px;
  height: 16px;
}

.cl-auth-panel:focus {
  outline: none;
}

/* Sur téléphone, la copie cache le lien du coin : on le garde sous le formulaire. */
</style>
