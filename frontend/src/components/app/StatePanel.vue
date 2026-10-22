<script setup>
// En attendant le serveur, ou quand il ne répond pas : Tux le prof, et de quoi réessayer.
import { computed, ref } from 'vue'
import { sceneImage } from '../../lib/images.js'

const props = defineProps({
  // « loading » ou « error ».
  state: { type: String, default: 'loading' },
  error: { type: Object, default: null },
  retry: { type: Function, default: null },
  label: { type: String, default: 'Chargement…' },
})

const retrying = ref(false)

const message = computed(() => {
  const error = props.error
  if (!error || error.status === 0) return { title: 'Le serveur ne répond pas', text: 'Vérifie ta connexion à Internet, puis réessaie.' }
  if (error.status >= 500) return { title: 'Le serveur a eu un problème', text: 'Ce n’est pas de ta faute. Réessaie dans un instant.' }
  return { title: 'Impossible d’afficher cette page', text: error.message }
})

const picture = computed(() => sceneImage(props.state === 'error' ? 'prof-unplugged' : 'prof-reading'))

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
  <div class="state" :class="`state--${state}`" :role="state === 'error' ? 'alert' : 'status'">
    <img :src="picture.src" alt="" class="state-picture" />
    <template v-if="state === 'error'">
      <h2 class="state-title">{{ message.title }}</h2>
      <p class="state-text">{{ message.text }}</p>
      <button v-if="retry" type="button" class="button button--blue" :disabled="retrying" @click="onRetry">
        {{ retrying ? 'Nouvel essai…' : 'Réessayer' }}
      </button>
    </template>
    <p v-else class="state-text">{{ label }}</p>
  </div>
</template>

<style scoped>
.state {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 48px 16px;
  text-align: center;
}

.state-picture {
  width: 150px;
}

.state--loading .state-picture {
  width: 110px;
  opacity: 0.85;
  animation: bob 1.4s ease-in-out infinite;
}

.state-title {
  font-size: 1.4rem;
}

.state-text {
  max-width: 36ch;
  color: var(--muted);
}

@keyframes bob {
  50% {
    transform: translateY(-8px);
  }
}
</style>
