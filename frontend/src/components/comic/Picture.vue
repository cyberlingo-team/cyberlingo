<script setup>
// Une image du site, avec ses dimensions pour que la page ne saute pas pendant le chargement.
defineProps({
  image: { type: Object, required: true },
  alt: { type: String, default: '' },
  eager: { type: Boolean, default: false },
})
</script>

<template>
  <img
    :src="image.src"
    :width="image.width"
    :height="image.height"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
  />
</template>
