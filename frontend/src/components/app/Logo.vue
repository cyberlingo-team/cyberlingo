<script setup>
// Le logo : la tête de Tux le prof et le nom du site, en minuscules rondes.
import head from '../../assets/brand/tux-prof-tete.svg'

defineProps({
  // « full » : la tête et le nom ; « head » : la tête seule (barre étroite).
  variant: { type: String, default: 'full' },
})
</script>

<template>
  <span class="logo" :class="`logo--${variant}`">
    <img :src="head" alt="" width="44" height="44" class="logo-head" />
    <span v-if="variant === 'full'" class="logo-name">cyberlingo</span>
    <span v-else class="visually-hidden">CyberLingo</span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--toque);
}

.logo-head {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.logo-name {
  font-size: 1.85rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
}
</style>
