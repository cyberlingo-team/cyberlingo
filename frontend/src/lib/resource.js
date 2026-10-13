// Charger une donnée du serveur dans un écran : la donnée, l'erreur éventuelle, l'état de
// chargement, et de quoi recommencer (bouton « Réessayer »).

import { ref, shallowRef } from 'vue'

export function useResource(loader, { immediate = true } = {}) {
  const data = shallowRef(null)
  const error = shallowRef(null)
  const loading = ref(false)
  let ticket = 0

  async function load() {
    const mine = ++ticket
    loading.value = true
    error.value = null
    try {
      const result = await loader()
      if (mine === ticket) data.value = result
    } catch (cause) {
      if (mine === ticket) error.value = cause
    } finally {
      if (mine === ticket) loading.value = false
    }
  }

  if (immediate) load()
  return { data, error, loading, reload: load }
}
