<script setup>
// Le cadre des pages de réglages (préférences, compte, crédits), repris de la copie de
// référence : une barre avec la flèche de retour et le titre, puis la page, sans la barre de
// navigation de l'appli.
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  // Où mène la flèche quand on ne vient pas d'une page du site.
  back: { type: String, default: '/apprendre' },
})

const router = useRouter()

function goBack(event, target) {
  // On revient à la page précédente si elle est du site, sinon au chemin.
  if (window.history.state?.back) {
    event.preventDefault()
    router.back()
  } else {
    event.preventDefault()
    router.push(target)
  }
}
</script>

<template>
  <div class="cl-app cl-settings">
    <header>
      <a :href="back" aria-label="Retour" @click="goBack($event, back)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
      <strong>{{ title }}</strong>
    </header>
    <main id="contenu" class="settings-main" tabindex="-1">
      <h1>{{ title }}</h1>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.cl-settings > header a {
  top: 14px;
  color: #9aa0b4;
}

.cl-settings > header a:hover {
  color: var(--ink);
}

.cl-settings > header svg {
  width: 26px;
  height: 26px;
}

.settings-main:focus {
  outline: none;
}

.settings-main > h1 {
  margin: 32px 0 48px;
}

/* Les titres de section, gris sur un filet. La règle de la copie de référence
   (.cl-app .cl-settings h2) ne s'applique pas, les deux classes étant sur le même élément. */
.settings-main :deep(h2) {
  margin: 40px 0 12px;
  padding-bottom: 10px;
  font-size: 24px;
  color: var(--muted);
  border-bottom: 2px solid var(--rule);
}

@media (max-width: 699px) {
  .settings-main :deep(h2) {
    margin-top: 32px;
    font-size: 20px;
  }

  .settings-main > h1 {
    font-size: 28px;
    margin: 16px 0 32px;
  }
}
</style>
