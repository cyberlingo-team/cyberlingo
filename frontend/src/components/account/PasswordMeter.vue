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
  if (!props.password) return `La CNIL recommande au moins ${minBits.value}\u00a0bits. La jauge se remplit pendant que tu tapes.`
  if (enough.value) return `${bits.value}\u00a0bits, pour ${minBits.value} recommandés par la CNIL : c’est solide.`
  if (bits.value < minBits.value / 2) return `${bits.value}\u00a0bits sur ${minBits.value} : bien trop fragile pour l’instant.`
  return `${bits.value}\u00a0bits sur ${minBits.value} : encore un effort, allonge-le.`
})
</script>

<template>
  <div :id="id" class="strength" :class="{ 'is-enough': enough }">
    <div class="strength-track" aria-hidden="true">
      <div class="strength-fill" :style="{ width: `${Math.max(ratio * 100, password ? 6 : 0)}%` }"></div>
    </div>
    <p class="strength-text" aria-live="polite">{{ verdict }}</p>
  </div>
</template>

<style scoped>
.strength {
  display: grid;
  gap: 6px;
}

.strength-track {
  position: relative;
  height: 12px;
  overflow: hidden;
  background: var(--rule);
  border-radius: 999px;
}

.strength-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--beak);
  border-radius: inherit;
  transition: width 0.2s ease-out;
}

.is-enough .strength-fill {
  background: var(--success);
}

.strength-text {
  font-size: 0.9rem;
  color: var(--muted);
}

.is-enough .strength-text {
  color: var(--success-ink);
  font-weight: 700;
}
</style>
