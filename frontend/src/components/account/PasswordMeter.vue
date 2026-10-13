<script setup>
// La solidité du mot de passe, mesurée pendant la frappe avec la méthode de la CNIL :
// longueur × log2(taille de l'alphabet utilisé). Les tailles d'alphabet et le seuil viennent du
// serveur (GET /api/auth/rules), qui refait le calcul de son côté : cette jauge ne fait que
// prévenir. Rien de ce qui est tapé ne quitte le navigateur avant l'envoi du formulaire.
import { computed } from 'vue'

const props = defineProps({
  password: { type: String, default: '' },
  rules: { type: Object, default: null },
  id: { type: String, default: undefined },
})

const minBits = computed(() => props.rules?.minBits || 80)

const bits = computed(() => {
  const alphabets = props.rules?.alphabets || { lowercase: 26, uppercase: 26, digits: 10, others: 40 }
  const password = props.password
  let size = 0
  if (/[a-z]/.test(password)) size += alphabets.lowercase
  if (/[A-Z]/.test(password)) size += alphabets.uppercase
  if (/[0-9]/.test(password)) size += alphabets.digits
  if (/[^a-zA-Z0-9]/.test(password)) size += alphabets.others
  return size ? Math.floor([...password].length * Math.log2(size)) : 0
})

const ratio = computed(() => Math.min(1, bits.value / minBits.value))
const enough = computed(() => bits.value >= minBits.value)

const verdict = computed(() => {
  if (!props.password) return `La CNIL recommande au moins ${minBits.value} bits. La jauge se remplit pendant que tu tapes.`
  if (enough.value) return `${bits.value} bits : c’est le niveau que la CNIL recommande.`
  if (bits.value < minBits.value / 2) return `${bits.value} bits sur ${minBits.value} : bien trop fragile pour l’instant.`
  return `${bits.value} bits sur ${minBits.value} : encore un effort, allonge-le.`
})
</script>

<template>
  <div :id="id" class="meter" :class="{ 'is-enough': enough }">
    <div class="meter-track" aria-hidden="true">
      <div class="meter-fill" :style="{ transform: `scaleX(${ratio})` }"></div>
      <span v-for="tick in 4" :key="tick" class="meter-tick" :style="{ left: `${tick * 20}%` }"></span>
    </div>
    <p class="meter-text" aria-live="polite">{{ verdict }}</p>
  </div>
</template>

<style scoped>
.meter {
  display: grid;
  gap: 4px;
}

.meter-track {
  position: relative;
  height: 14px;
  background: var(--paper);
  border: 2px solid var(--ink);
  overflow: hidden;
}

.meter-fill {
  position: absolute;
  inset: 0;
  background: var(--beak);
  transform-origin: left;
  transition: transform 0.2s ease-out;
}

.is-enough .meter-fill {
  background: var(--toque);
}

.meter-tick {
  position: absolute;
  top: 0;
  bottom: 50%;
  width: 2px;
  background: var(--ink);
}

.meter-text {
  font-size: 0.92rem;
  color: var(--muted);
}

.is-enough .meter-text {
  color: var(--toque);
  font-weight: 600;
}
</style>
