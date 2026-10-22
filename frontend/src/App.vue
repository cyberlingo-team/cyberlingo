<script setup>
// La racine du site : le message éphémère (« Tu es déconnecté »…) et l'écran demandé. Chaque
// écran pose sa propre coque (AppShell pour l'appli, plein écran pour une leçon) et son <main>,
// d'identifiant « contenu ».
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import FlashMessage from './components/FlashMessage.vue'
import { loadSession } from './lib/session.js'

loadSession()

const router = useRouter()
let first = true

// Après un changement de page, le lecteur d'écran repart du début du contenu.
router.afterEach((to, from) => {
  if (first) {
    first = false
    return
  }
  if (to.path === from.path) return
  nextTick(() => document.getElementById('contenu')?.focus({ preventScroll: true }))
})
</script>

<template>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <FlashMessage />
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" :key="route.path" />
  </RouterView>
</template>

<style>
.skip-link {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 8px 14px;
  font-weight: 800;
  color: #fff;
  background: var(--toque);
  border-radius: var(--radius-small);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}

#app {
  /* Une image qui grandit ne doit jamais élargir la page sur téléphone. */
  overflow-x: clip;
}
</style>
