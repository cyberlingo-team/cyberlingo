<script setup>
import { computed } from 'vue'
import { preferences } from '../lib/preferences.js'
import { playSound } from '../lib/sound.js'

const sound = computed({
  get: () => preferences.sound,
  set: (value) => {
    preferences.sound = value
    if (value) playSound('correct')
  },
})

const motion = computed({
  get: () => preferences.motion === 'full',
  set: (value) => (preferences.motion = value ? 'full' : 'reduced'),
})
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <nav class="footer-links" aria-label="Pied de page">
        <RouterLink to="/la-bande">La bande à Tux</RouterLink>
        <RouterLink to="/credits">Crédits</RouterLink>
      </nav>

      <div class="footer-prefs">
        <label class="toggle">
          <input v-model="sound" type="checkbox" />
          <span class="toggle-box" aria-hidden="true"></span>
          Bruitages
        </label>
        <label class="toggle">
          <input v-model="motion" type="checkbox" />
          <span class="toggle-box" aria-hidden="true"></span>
          Animations
        </label>
      </div>

      <p class="footer-note">
        Les banques, boutiques, numéros et personnages des épisodes sont inventés. Les conseils suivent les
        recommandations de l’ANSSI, de la CNIL et de Cybermalveillance.gouv.fr.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 24px;
  padding: 22px 0 calc(22px + var(--tabbar-height) + env(safe-area-inset-bottom));
  background: var(--paper);
  border-top: var(--line) solid var(--ink);
  font-size: 0.95rem;
}

.footer-inner {
  width: min(100% - 2 * var(--gutter), 1120px);
  margin-inline: auto;
  display: grid;
  gap: 14px;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  font-weight: 600;
}

.footer-prefs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
}

.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  cursor: pointer;
  font-weight: 500;
}

.toggle input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.toggle-box {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ink);
  background: var(--paper);
  display: grid;
  place-items: center;
}

.toggle input:checked + .toggle-box {
  background: var(--toque);
}

.toggle input:checked + .toggle-box::after {
  content: '';
  width: 10px;
  height: 6px;
  margin-top: -3px;
  border-left: 3px solid var(--paper);
  border-bottom: 3px solid var(--paper);
  transform: rotate(-45deg);
}

.toggle input:focus-visible + .toggle-box {
  outline: 3px solid var(--toque);
  outline-offset: 2px;
}

.footer-note {
  max-width: 70ch;
  color: var(--muted);
  font-size: 0.9rem;
}

@media (min-width: 860px) {
  .footer {
    padding-bottom: 26px;
  }

  .footer-inner {
    grid-template-columns: auto auto 1fr;
    align-items: center;
    gap: 14px 36px;
  }

  .footer-note {
    justify-self: end;
    text-align: right;
  }
}
</style>
