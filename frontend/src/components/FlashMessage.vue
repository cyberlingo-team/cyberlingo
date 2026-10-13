<script setup>
// Le petit récitatif qui confirme ce qui vient de se passer (« Tu es déconnecté »…). Il survit à
// la redirection qui suit l'action, puis s'efface à la navigation suivante, ou quand on le ferme.
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { clearFlash, flash } from '../lib/flash.js'

const REDIRECT_DELAY = 4000

const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    if (flash.text && Date.now() - flash.at > REDIRECT_DELAY) clearFlash()
  },
)
</script>

<template>
  <div class="flash-zone" role="status" aria-live="polite">
    <p v-if="flash.text" :key="flash.id" class="flash caption">
      <span>{{ flash.text }}</span>
      <button type="button" class="flash-close" @click="clearFlash">
        <span aria-hidden="true">×</span><span class="visually-hidden">Fermer le message</span>
      </button>
    </p>
  </div>
</template>

<style scoped>
.flash-zone {
  width: min(100% - 2 * var(--gutter), var(--column));
  margin-inline: auto;
}

.flash {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: var(--gutter);
  border-width: 3px;
  animation: flash-in 0.25s ease-out;
}

.flash-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin: -4px -6px -4px 0;
  font-size: 1.4rem;
  line-height: 1;
  background: none;
  border: 2px solid transparent;
}

.flash-close:hover {
  border-color: var(--ink);
}

@keyframes flash-in {
  from {
    transform: translateY(-6px) rotate(-1deg);
    opacity: 0;
  }
}
</style>
