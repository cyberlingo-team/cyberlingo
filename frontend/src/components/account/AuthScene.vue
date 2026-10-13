<script setup>
// La case qui accompagne les formulaires de compte : un personnage et ce qu'il dit.
import Balloon from '../comic/Balloon.vue'
import Picture from '../comic/Picture.vue'

defineProps({
  image: { type: Object, required: true },
  alt: { type: String, default: '' },
})
</script>

<template>
  <figure class="scene panel">
    <Balloon class="scene-balloon" tail="down-left">
      <slot />
    </Balloon>
    <Picture class="scene-image" :image="image" :alt="alt" eager />
  </figure>
</template>

<style scoped>
.scene {
  display: grid;
  align-content: end;
  gap: 4px;
  padding: 18px 18px 0;
  background: var(--toque-pale);
  overflow: hidden;
}

.scene-balloon {
  justify-self: end;
  max-width: 30ch;
}

.scene-image {
  width: min(62%, 240px);
  margin-bottom: -6px;
}

@media (max-width: 640px) {
  .scene {
    grid-template-columns: 96px 1fr;
    align-items: end;
    padding: 12px 12px 0;
  }

  .scene-balloon {
    grid-column: 2;
    grid-row: 1;
    justify-self: start;
    align-self: center;
    margin-bottom: 10px;
  }

  .scene-image {
    grid-column: 1;
    grid-row: 1;
    width: 96px;
  }
}
</style>
