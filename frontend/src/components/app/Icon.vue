<script setup>
// Une petite illustration de l'interface (voir lib/images.js), à la taille demandée.
import { computed } from 'vue'
import { iconImage } from '../../lib/images.js'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 28 },
  alt: { type: String, default: '' },
})

const image = computed(() => iconImage(props.name))
</script>

<template>
  <img class="icon" :src="image.src" :alt="alt" :style="{ width: `${size}px`, height: `${size}px` }" />
</template>

<style scoped>
.icon {
  flex-shrink: 0;
  object-fit: contain;
}
</style>
