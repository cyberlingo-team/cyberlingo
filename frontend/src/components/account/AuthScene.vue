<script setup>
// L'écran plein des formulaires de compte : un bouton pour fermer, Tux qui parle dans sa
// bulle, puis le formulaire, centré.
import { useRouter } from 'vue-router'

defineProps({
  image: { type: Object, required: true },
  // Où mène le bouton « fermer ».
  close: { type: String, default: '/' },
})

const router = useRouter()
</script>

<template>
  <div class="auth">
    <header class="auth-top">
      <button type="button" class="auth-close" aria-label="Fermer" @click="router.push(close)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
      </button>
      <slot name="top" />
    </header>
    <main id="contenu" class="auth-main" tabindex="-1">
      <div class="auth-talk">
        <img :src="image.src" alt="" class="auth-image" />
        <p class="auth-bubble"><slot name="line" /></p>
      </div>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  min-height: 100dvh;
}

.auth-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}

.auth-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #9aa0b4;
  background: none;
  border: 0;
  border-radius: 50%;
}

.auth-close:hover {
  color: var(--ink);
  background: var(--wash);
}

.auth-close svg {
  width: 26px;
  height: 26px;
}

.auth-main {
  display: grid;
  gap: 20px;
  width: min(420px, 100%);
  margin: 0 auto;
  padding: 0 var(--gutter) 48px;
}

.auth-talk {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.auth-image {
  flex-shrink: 0;
  width: 88px;
  height: 100px;
  object-fit: contain;
  object-position: bottom;
}

.auth-bubble {
  position: relative;
  margin-bottom: 18px;
  padding: 12px 16px;
  font-weight: 700;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.auth-bubble::before {
  content: '';
  position: absolute;
  left: -9px;
  bottom: 18px;
  width: 14px;
  height: 14px;
  background: var(--paper);
  border-left: 2px solid var(--rule);
  border-bottom: 2px solid var(--rule);
  transform: rotate(45deg);
}
</style>
