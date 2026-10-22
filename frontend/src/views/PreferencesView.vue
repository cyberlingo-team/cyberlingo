<script setup>
// Les préférences de confort, gardées dans ce navigateur : les bruitages et les animations. La
// mise en page reprend les paramètres de la copie de référence : une ligne et un interrupteur par
// réglage. Le compte (pseudo, mot de passe) a sa propre page.
import { computed } from 'vue'
import SettingsFrame from '../components/account/SettingsFrame.vue'
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
  <SettingsFrame title="Préférences">
    <h2>Paramètres des leçons</h2>

    <div class="cl-preference">
      <div class="preference-text">
        <span id="sound-label">Bruitages</span>
        <small id="sound-hint">Un petit son pour une bonne réponse, une erreur ou un coffre ouvert.</small>
      </div>
      <button
        type="button"
        role="switch"
        class="cl-switch"
        :class="{ on: preferences.sound }"
        :aria-checked="preferences.sound"
        aria-labelledby="sound-label"
        aria-describedby="sound-hint"
        @click="toggleSound"
      >
        <span></span>
      </button>
    </div>

    <div class="cl-preference">
      <div class="preference-text">
        <span id="motion-label">Animations</span>
        <small id="motion-hint">Coupe les mouvements (coffres qui bougent, Tux qui grandit) si ça te gêne.</small>
      </div>
      <button
        type="button"
        role="switch"
        class="cl-switch"
        :class="{ on: motionFull }"
        :aria-checked="motionFull"
        aria-labelledby="motion-label"
        aria-describedby="motion-hint"
        @click="motionFull = !motionFull"
      >
        <span></span>
      </button>
    </div>

    <p class="preferences-note">Ces réglages sont gardés dans ce navigateur.</p>

    <h2>Compte</h2>
    <RouterLink v-if="session.user" class="cl-settings-account" to="/mon-compte">Gérer mon compte</RouterLink>
    <div v-else class="preferences-guest">
      <p>Crée un profil pour garder ta série, tes points et ton Tux d’un jour à l’autre.</p>
      <div>
        <RouterLink class="cl-button green" to="/inscription">Créer un profil</RouterLink>
        <RouterLink class="cl-button" to="/connexion">Se connecter</RouterLink>
      </div>
    </div>

    <h2>Plus</h2>
    <nav class="preferences-more" aria-label="Autres pages">
      <RouterLink to="/aide">Aide</RouterLink>
      <RouterLink to="/credits">Crédits</RouterLink>
    </nav>
  </SettingsFrame>
</template>

<style scoped>
.cl-preference {
  gap: 16px;
  padding: 8px 0;
}

.preference-text {
  display: grid;
  gap: 2px;
}

.preference-text small {
  font-size: 15px;
  font-weight: 500;
  color: var(--muted);
}

.cl-switch {
  flex-shrink: 0;
  cursor: pointer;
}

.preferences-note {
  margin-top: 8px;
  font-size: 15px;
  color: #9aa0b4;
}

.cl-settings-account {
  margin-top: 16px;
  font-size: 20px;
}

.preferences-guest {
  display: grid;
  gap: 16px;
  color: var(--muted);
}

.preferences-guest > div {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preferences-guest .cl-button {
  width: auto;
  min-width: 200px;
}

.preferences-more {
  display: flex;
  gap: 24px;
  font-size: 20px;
  font-weight: 700;
}

.preferences-more a {
  color: var(--toque-bright);
}

@media (max-width: 699px) {
  .preferences-guest .cl-button {
    flex: 1;
  }
}
</style>
