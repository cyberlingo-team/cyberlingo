<script setup>
// La planche qui accueille tous les écrans : en-tête, contenu, pied de page et, sur téléphone,
// la barre d'onglets en bas.
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AppTabBar from './components/AppTabBar.vue'
import FlashMessage from './components/FlashMessage.vue'
import { loadSession } from './lib/session.js'

loadSession()

const router = useRouter()
const main = ref(null)
let first = true

// Après un changement de page, le lecteur d'écran repart du début du contenu.
router.afterEach((to, from) => {
  if (first) {
    first = false
    return
  }
  if (to.path === from.path) return
  nextTick(() => main.value?.focus({ preventScroll: true }))
})
</script>

<template>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <AppHeader />
  <FlashMessage />
  <main id="contenu" ref="main" tabindex="-1">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </RouterView>
  </main>
  <AppFooter />
  <AppTabBar />
</template>

<style>
.skip-link {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 8px 14px;
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--ink);
  background: var(--caption);
  border: var(--line) solid var(--ink);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}

#contenu {
  display: block;
  min-height: calc(100vh - var(--header-height) - 160px);
  /* Un tampon qui s'abat ou une image qui grandit ne doit jamais élargir la page sur téléphone. */
  overflow-x: clip;
}
</style>
