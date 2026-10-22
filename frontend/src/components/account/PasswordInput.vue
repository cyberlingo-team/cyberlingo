<script setup>
// Un champ de mot de passe qu'on peut afficher en clair, pour relire ce qu'on a tapé. Le bouton
// se loge à droite du champ, comme le lien « Oublié ? » de la copie de référence.
import { ref } from 'vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  id: { type: String, required: true },
  autocomplete: { type: String, default: 'current-password' },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  maxlength: { type: Number, default: undefined },
  placeholder: { type: String, default: 'Mot de passe' },
  label: { type: String, default: 'Mot de passe' },
})

const visible = ref(false)
</script>

<template>
  <div class="cl-password">
    <input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :aria-label="label"
      :placeholder="placeholder"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="describedby"
      :maxlength="maxlength"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
    />
    <button type="button" class="password-toggle" @click="visible = !visible">
      {{ visible ? 'Masquer' : 'Afficher' }}<span class="visually-hidden"> le mot de passe</span>
    </button>
  </div>
</template>

<style scoped>
.cl-password {
  position: relative;
}

.cl-password input {
  padding-right: 104px;
}

.password-toggle {
  position: absolute;
  top: 0;
  right: 6px;
  bottom: 0;
  padding: 0 10px;
  font: 800 15px var(--font-title);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #9aa0b4;
  background: none;
  border: 0;
  cursor: pointer;
}

.password-toggle:hover {
  color: var(--toque-bright);
}
</style>
