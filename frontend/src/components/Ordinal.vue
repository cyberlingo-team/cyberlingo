<script setup>
// Un rang écrit à la française : 1er, 2e, 42e, avec la terminaison en exposant.
defineProps({
  rank: { type: Number, required: true },
})
</script>

<template>
  <span class="ordinal">{{ rank }}<sup>{{ rank === 1 ? 'er' : 'e' }}</sup></span>
</template>

<style scoped>
.ordinal {
  white-space: nowrap;
}

.ordinal sup {
  font-size: 0.6em;
  line-height: 0;
  vertical-align: 0.5em;
}
</style>
