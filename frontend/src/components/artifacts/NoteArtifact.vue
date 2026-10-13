<script setup>
import Z from './ZoneText.vue'

defineProps({ artifact: { type: Object, required: true } })
</script>

<template>
  <div class="note" :class="`note--${artifact.style || 'paper'}`">
    <p v-if="artifact.title" class="note-title"><Z :t="artifact.title" /></p>
    <p v-for="(line, index) in artifact.lines" :key="index" class="note-line"><Z :t="line" /></p>
  </div>
</template>

<style scoped>
.note {
  max-width: 360px;
  padding: 16px 18px 18px;
  font-family: var(--font-hand);
  font-size: 1.02rem;
  line-height: 1.6;
  color: #1f2a5a;
}

.note-title {
  font-weight: 700;
  margin-bottom: 4px;
}

/* Le post-it jaune, collé de travers. */
.note--postit {
  background: #fff07a;
  border: 2px solid var(--ink);
  transform: rotate(-1.5deg);
}

/* La feuille de cahier à lignes. */
.note--paper {
  background-color: #fff;
  background-image: linear-gradient(transparent calc(1.6em - 1px), #b9d4ec calc(1.6em - 1px), #b9d4ec 1.6em);
  background-size: 100% 1.6em;
  background-position: 0 16px;
  border: 2px solid var(--ink);
  border-left: 6px double #e28b8b;
}

/* L'étiquette collée sur un appareil. */
.note--label {
  font-family: var(--font-object);
  font-size: 0.92rem;
  line-height: 1.5;
  color: #1d1d1f;
  background: #f1f2f4;
  border: 2px solid var(--ink);
  border-radius: 8px;
  box-shadow: inset 0 0 0 4px #fff;
}
</style>
