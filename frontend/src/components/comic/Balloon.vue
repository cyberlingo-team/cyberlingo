<script setup>
// Une bulle de BD. La queue pointe vers celui qui parle : à gauche, à droite, en bas, ou
// « down-left » : en bas sur grand écran, à gauche sur téléphone (quand l'image passe à côté).
defineProps({
  tail: { type: String, default: 'left' },
  as: { type: String, default: 'div' },
})
</script>

<template>
  <component :is="as" class="balloon" :class="`balloon--${tail}`">
    <slot />
    <svg v-if="tail !== 'down'" class="balloon-tail balloon-tail--side" viewBox="0 0 30 24" aria-hidden="true">
      <path d="M30 3 C 21 8, 12 14, 1 22 C 13 19, 22 17, 30 15" />
    </svg>
    <svg v-if="tail === 'down' || tail === 'down-left'" class="balloon-tail balloon-tail--down" viewBox="0 0 24 30" aria-hidden="true">
      <path d="M3 0 C 7 11, 7 20, 1 29 C 11 22, 16 13, 18 0" />
    </svg>
  </component>
</template>

<style scoped>
.balloon {
  position: relative;
  background: var(--paper);
  border: 2.5px solid var(--ink);
  border-radius: 1.6em;
  padding: 0.65em 1em;
  font-family: var(--font-hand);
  line-height: 1.42;
}

.balloon-tail {
  position: absolute;
  overflow: visible;
  fill: var(--paper);
  stroke: var(--ink);
  stroke-width: 2.5px;
  stroke-linejoin: round;
}

.balloon-tail--side {
  width: 28px;
  height: 22px;
  left: -25px;
  bottom: 12px;
}

.balloon--right .balloon-tail--side {
  left: auto;
  right: -25px;
  transform: scaleX(-1);
}

.balloon-tail--down {
  width: 22px;
  height: 28px;
  left: 28px;
  bottom: -25px;
}

.balloon--down-left .balloon-tail--side {
  display: none;
}

@media (max-width: 640px) {
  .balloon--down-left .balloon-tail--side {
    display: block;
  }

  .balloon--down-left .balloon-tail--down {
    display: none;
  }
}
</style>
