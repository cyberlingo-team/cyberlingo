<script setup>
// Le nom du site, dont les lettres prennent du muscle de gauche à droite, comme le Tux du
// joueur au fil des épisodes.
const LETTERS = 'CyberLingo'.split('')

function letterStyle(index) {
  const progress = index / (LETTERS.length - 1)
  return {
    fontWeight: Math.round(320 + progress * 580),
    fontStretch: `${Math.round(72 + progress * 58)}%`,
  }
}
</script>

<template>
  <span class="wordmark">
    <span class="visually-hidden">CyberLingo</span>
    <span v-for="(letter, index) in LETTERS" :key="index" class="wordmark-letter" :style="letterStyle(index)" aria-hidden="true">{{ letter }}</span>
  </span>
</template>

<style scoped>
.wordmark {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-title);
  font-size: 1.55rem;
  line-height: 1;
  letter-spacing: -0.005em;
  color: var(--ink);
  white-space: nowrap;
}
</style>
