<script setup>
// Pendant le chargement, une case se crayonne au bleu, comme sur la planche d'un dessinateur.
// Elle n'apparaît qu'après un court délai : une réponse rapide ne fait pas clignoter l'écran.
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  label: { type: String, default: 'Chargement en cours' },
  compact: { type: Boolean, default: false },
})

const visible = ref(false)
let timer = null

onMounted(() => {
  timer = setTimeout(() => (visible.value = true), 220)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="loading" :class="{ 'loading--compact': compact }" role="status" aria-live="polite">
    <span class="visually-hidden">{{ label }}…</span>
    <div v-if="visible" class="loading-panel panel" aria-hidden="true">
      <p class="caption loading-caption">Pendant ce temps, au serveur…</p>
      <svg class="loading-sketch" viewBox="0 0 220 150">
        <path class="stroke s1" d="M86 128 C 70 110, 68 70, 88 50 C 100 38, 122 38, 134 50 C 154 70, 152 110, 136 128 Z" />
        <path class="stroke s2" d="M94 62 C 100 54, 110 52, 116 56 M106 60 C 112 52, 124 52, 128 60" />
        <path class="stroke s3" d="M104 72 L 120 72 L 112 82 Z" />
        <path class="stroke s4" d="M78 132 C 90 126, 100 126, 108 132 M116 132 C 124 126, 136 126, 146 132" />
        <path class="stroke s5" d="M40 40 L 60 46 M34 70 L 58 72 M40 100 L 60 96" />
        <path class="stroke s6" d="M166 46 C 176 40, 190 40, 196 50 C 202 60, 194 72, 180 72 L 170 80 L 172 70 C 160 66, 158 54, 166 46 Z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.loading {
  min-height: 220px;
}

.loading--compact {
  min-height: 120px;
}

.loading-panel {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 0 0 18px;
  border-color: #a9c9de;
  border-style: dashed;
  background: rgba(255, 255, 255, 0.75);
}

.loading-caption {
  justify-self: start;
  margin: -2px 0 0 -2px;
}

.loading-sketch {
  width: min(260px, 70%);
  height: auto;
}

/* Bleu non reproductible : la couleur du crayon des dessinateurs de BD. */
.stroke {
  fill: none;
  stroke: #6fb3d9;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 420;
  stroke-dashoffset: 420;
  animation: sketch 2.4s ease-in-out infinite;
}

.s2 {
  animation-delay: 0.25s;
}
.s3 {
  animation-delay: 0.4s;
}
.s4 {
  animation-delay: 0.55s;
}
.s5 {
  animation-delay: 0.7s;
}
.s6 {
  animation-delay: 0.85s;
}

@keyframes sketch {
  0% {
    stroke-dashoffset: 420;
  }
  55%,
  80% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

:global(html[data-motion='reduced']) .stroke {
  stroke-dashoffset: 0;
  animation: none;
}
</style>
