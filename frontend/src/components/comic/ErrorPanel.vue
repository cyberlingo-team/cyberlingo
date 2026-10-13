<script setup>
// Quand le serveur ne répond pas (ou se trompe) : Tux le prof, débranché, et de quoi réessayer.
import { computed, ref } from 'vue'
import Picture from './Picture.vue'
import { sceneImage } from '../../lib/images.js'

const props = defineProps({
  error: { type: Object, default: null },
  retry: { type: Function, default: null },
  compact: { type: Boolean, default: false },
})

const retrying = ref(false)

const message = computed(() => {
  const error = props.error
  if (!error || error.status === 0) {
    return {
      title: 'Le serveur ne répond pas',
      text: 'Vérifie ta connexion à Internet, puis réessaie.',
    }
  }
  if (error.status >= 500) {
    return {
      title: 'Le serveur a eu un problème',
      text: 'Ce n’est pas de ta faute. Réessaie dans un instant.',
    }
  }
  return { title: 'Impossible d’afficher cette page', text: error.message }
})

async function onRetry() {
  retrying.value = true
  try {
    await props.retry()
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <section class="error panel" :class="{ 'error--compact': compact }" role="alert">
    <Picture class="error-art" :image="sceneImage('prof-unplugged')" alt="Tux le professeur tient deux bouts de câble débranchés." eager />
    <div class="error-text">
      <h2 class="error-title">{{ message.title }}</h2>
      <p>{{ message.text }}</p>
      <button v-if="retry" type="button" class="button" :disabled="retrying" @click="onRetry">
        {{ retrying ? 'Nouvel essai…' : 'Réessayer' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.error {
  display: grid;
  grid-template-columns: minmax(110px, 200px) 1fr;
  align-items: center;
  gap: clamp(12px, 3vw, 28px);
  padding: clamp(14px, 3vw, 26px);
}

.error-art {
  width: 100%;
}

.error-text {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.error-title {
  font-size: clamp(1.5rem, 4.6vw, 2.1rem);
  font-weight: 850;
}

.error--compact {
  grid-template-columns: 90px 1fr;
}

.error--compact .error-title {
  font-size: 1.3rem;
}

@media (max-width: 420px) {
  .error {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .error-art {
    width: 150px;
  }

  .error-text {
    justify-items: center;
  }

  .error--compact {
    grid-template-columns: 70px 1fr;
    text-align: left;
    justify-items: stretch;
  }

  .error--compact .error-art {
    width: 70px;
  }

  .error--compact .error-text {
    justify-items: start;
  }
}
</style>
