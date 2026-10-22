<script setup>
// Les préférences de confort, gardées dans ce navigateur : les bruitages et les animations.
// Le compte (pseudo, mot de passe) a sa propre page.
import { computed } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import { preferences } from '../lib/preferences.js'
import { session } from '../lib/session.js'
import { playSound } from '../lib/sound.js'

const motionFull = computed({
  get: () => preferences.motion === 'full',
  set: (value) => (preferences.motion = value ? 'full' : 'reduced'),
})

function toggleSound() {
  preferences.sound = !preferences.sound
  // On fait entendre tout de suite ce qu'on vient d'allumer.
  if (preferences.sound) playSound('correct')
}
</script>

<template>
  <AppShell width="text">
    <div class="preferences">
      <h1 class="section-title">Préférences</h1>

      <section class="card group" aria-labelledby="comfort-title">
        <h2 id="comfort-title" class="group-title">Confort</h2>

        <div class="setting">
          <div class="setting-text">
            <p id="sound-label" class="setting-label">Bruitages</p>
            <p id="sound-hint" class="setting-hint">Un petit son pour une bonne réponse, une erreur ou un coffre ouvert.</p>
          </div>
          <button
            type="button"
            role="switch"
            class="switch"
            :aria-checked="preferences.sound"
            aria-labelledby="sound-label"
            aria-describedby="sound-hint"
            @click="toggleSound"
          >
            <span class="switch-knob" aria-hidden="true"></span>
          </button>
        </div>

        <div class="setting">
          <div class="setting-text">
            <p id="motion-label" class="setting-label">Animations</p>
            <p id="motion-hint" class="setting-hint">Coupe les mouvements (coffres qui bougent, Tux qui grandit) si ça te gêne.</p>
          </div>
          <button
            type="button"
            role="switch"
            class="switch"
            :aria-checked="motionFull"
            aria-labelledby="motion-label"
            aria-describedby="motion-hint"
            @click="motionFull = !motionFull"
          >
            <span class="switch-knob" aria-hidden="true"></span>
          </button>
        </div>

        <p class="group-note">Ces réglages sont gardés dans ce navigateur.</p>
      </section>

      <section class="card group" aria-labelledby="account-title">
        <h2 id="account-title" class="group-title">Compte</h2>
        <template v-if="session.user">
          <RouterLink to="/mon-compte" class="row-link">
            <span>
              <span class="setting-label">Mon compte</span>
              <span class="setting-hint">Changer de pseudo ou de mot de passe, supprimer le compte.</span>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </RouterLink>
        </template>
        <div v-else class="guest">
          <p class="setting-hint">Crée un profil pour garder ta série, tes points et ton Tux d’un jour à l’autre.</p>
          <div class="guest-actions">
            <RouterLink to="/inscription" class="button">Créer un profil</RouterLink>
            <RouterLink to="/connexion" class="button button--ghost">Se connecter</RouterLink>
          </div>
        </div>
      </section>

      <nav class="more" aria-label="Autres pages">
        <RouterLink to="/aide">Aide</RouterLink>
        <RouterLink to="/credits">Crédits</RouterLink>
      </nav>
    </div>
  </AppShell>
</template>

<style scoped>
.preferences {
  display: grid;
  gap: 24px;
}

.group {
  display: grid;
}

.group-title {
  padding: 18px 20px 6px;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
}

.setting + .setting {
  border-top: 2px solid var(--rule);
}

.setting-text {
  display: grid;
  gap: 2px;
}

.setting-label {
  display: block;
  font-weight: 800;
  color: var(--ink);
}

.setting-hint {
  display: block;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--muted);
}

.group-note {
  padding: 4px 20px 18px;
  font-size: 0.85rem;
  color: #9aa0b4;
}

/* L'interrupteur : bleu quand c'est allumé. */
.switch {
  position: relative;
  flex-shrink: 0;
  width: 58px;
  height: 34px;
  padding: 0;
  background: var(--rule-strong);
  border: 0;
  border-radius: 999px;
  transition: background-color 0.15s;
}

.switch[aria-checked='true'] {
  background: var(--toque-bright);
}

.switch-knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 26px;
  height: 26px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  transition: transform 0.15s;
}

.switch[aria-checked='true'] .switch-knob {
  transform: translateX(24px);
}

.row-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px 18px;
}

.row-link:hover {
  text-decoration: none;
  background: var(--wash);
  border-radius: 0 0 var(--radius) var(--radius);
}

.row-link svg {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  color: #9aa0b4;
}

.guest {
  display: grid;
  gap: 12px;
  padding: 8px 20px 20px;
}

.guest-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.more {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
