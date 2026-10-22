<script setup>
// Le petit message qui confirme ce qui vient de se passer (« Tu es déconnecté »…), en haut de
// l'écran. Il survit à la redirection qui suit l'action, puis s'efface à la navigation suivante,
// au bout de quelques secondes, ou quand on le ferme.
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { clearFlash, flash } from '../lib/flash.js'

const REDIRECT_DELAY = 4000
const LIFETIME = 6000

const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    if (flash.text && Date.now() - flash.at > REDIRECT_DELAY) clearFlash()
  },
)

let timer = null
watch(
  () => flash.id,
  () => {
    clearTimeout(timer)
    const id = flash.id
    timer = setTimeout(() => {
      if (flash.id === id) clearFlash()
    }, LIFETIME)
  },
)
</script>

<template>
  <div class="flash-zone" role="status" aria-live="polite">
    <p v-if="flash.text" :key="flash.id" class="flash">
      <span>{{ flash.text }}</span>
      <button type="button" class="flash-close" @click="clearFlash">
        <span aria-hidden="true">×</span><span class="visually-hidden">Fermer le message</span>
      </button>
    </p>
  </div>
</template>

<style scoped>
.flash-zone {
  position: fixed;
  top: 16px;
  left: 50%;
  z-index: 60;
  width: min(480px, calc(100% - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.flash {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 12px 18px;
  font-weight: 800;
  color: #fff;
  background: var(--toque);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--toque-deep), 0 12px 24px rgba(29, 34, 51, 0.2);
  pointer-events: auto;
  animation: flash-in 0.25s ease-out;
}

.flash-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  font-size: 1.4rem;
  line-height: 1;
  color: #fff;
  background: none;
  border: 0;
  border-radius: 50%;
}

.flash-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

@keyframes flash-in {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
}
</style>
