<script setup>
// Un coup de tampon encreur : « Piège » en rouge, « Fiable » en bleu, « Démasqué »…
defineProps({
  tone: { type: String, default: 'alert' },
  animate: { type: Boolean, default: false },
  as: { type: String, default: 'span' },
})
</script>

<template>
  <component :is="as" class="stamp" :class="[`stamp--${tone}`, { 'stamp--animate': animate }]"><slot /></component>
</template>

<style scoped>
.stamp {
  display: inline-block;
  padding: 0.16em 0.5em 0.1em;
  font-family: var(--font-title);
  font-size: 1.7rem;
  font-weight: 900;
  font-stretch: 125%;
  line-height: 1;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--alert);
  border: 4px solid currentColor;
  outline: 2px solid currentColor;
  outline-offset: 3px;
  transform: rotate(-8deg);
  /* Encre irrégulière : un bruit fractal perce le tampon de petits manques. */
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.2 0 0 0 2.45'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.2 0 0 0 2.45'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.stamp--safe {
  color: var(--toque);
}

.stamp--ink {
  color: var(--ink);
}

.stamp--animate {
  animation: stamp-in 0.34s cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
}

@keyframes stamp-in {
  from {
    opacity: 0;
    transform: rotate(-18deg) scale(2.3);
  }
  55% {
    opacity: 1;
  }
  to {
    opacity: 1;
    transform: rotate(-8deg) scale(1);
  }
}
</style>
