<script setup>
// Un champ de mot de passe qu'on peut afficher en clair, pour relire ce qu'on a tapé.
import { ref } from 'vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  id: { type: String, required: true },
  autocomplete: { type: String, default: 'current-password' },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  maxlength: { type: Number, default: undefined },
})

const visible = ref(false)
</script>

<template>
  <div class="password">
    <input
      :id="id"
      v-model="model"
      class="input password-input"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
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
.password {
  position: relative;
}

.password-input {
  padding-right: 6.6em;
}

.password-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  bottom: 8px;
  min-width: 5.6em;
  padding: 0 0.7em;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--toque-bright);
  background: var(--paper);
  border: 2px solid var(--rule);
  border-radius: 10px;
}

.password-toggle:hover {
  background: var(--toque-pale);
  border-color: var(--toque-line);
}
</style>
