// Un court message affiché en haut de l'écran suivant (« Tu es déconnecté », « Compte supprimé »…).

import { reactive } from 'vue'

export const flash = reactive({ text: '', id: 0, at: 0 })

export function showFlash(text) {
  flash.text = text
  flash.id += 1
  flash.at = Date.now()
}

export function clearFlash() {
  flash.text = ''
}
