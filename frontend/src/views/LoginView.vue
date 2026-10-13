<script setup>
// Se connecter avec son pseudo et son mot de passe. La réponse du serveur dépose le cookie de
// session ; l'interface, elle, ne voit jamais de jeton.
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthScene from '../components/account/AuthScene.vue'
import PasswordInput from '../components/account/PasswordInput.vue'
import { login } from '../lib/session.js'
import { showFlash } from '../lib/flash.js'
import { claimedMessage } from '../lib/claimed.js'
import { safeRedirect } from '../lib/navigation.js'
import { sceneImage } from '../lib/images.js'

const route = useRoute()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const fields = ref({})
const problem = ref('')
const sending = ref(false)

const redirect = computed(() => safeRedirect(route.query.redirect))
const signupLink = computed(() => (route.query.redirect ? { path: '/inscription', query: { redirect: route.query.redirect } } : '/inscription'))

async function submit() {
  if (sending.value) return
  fields.value = {}
  problem.value = ''
  sending.value = true
  try {
    const { user, claimed } = await login(form.username, form.password)
    showFlash(claimedMessage(claimed) || `Content de te revoir, ${user.username}.`)
    router.push(redirect.value)
  } catch (error) {
    if (error.status === 400) fields.value = error.fields
    else if (error.unreachable) problem.value = 'Le serveur ne répond pas. Vérifie ta connexion à Internet, puis réessaie.'
    else problem.value = error.message
    form.password = ''
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="page page--wide auth">
    <AuthScene :image="sceneImage('prof-magnifier')" class="auth-scene">
      Avant d’entrer, je vérifie : ton pseudo et ton mot de passe, s’il te plaît.
    </AuthScene>

    <form class="auth-form panel panel--pad" novalidate @submit.prevent="submit">
      <h1 class="auth-title">Se connecter</h1>

      <p v-if="problem" class="auth-problem" role="alert">{{ problem }}</p>

      <div class="field">
        <label for="login-username">Pseudo</label>
        <input
          id="login-username"
          v-model="form.username"
          class="input"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          maxlength="60"
          :aria-invalid="fields.username ? 'true' : undefined"
          :aria-describedby="fields.username ? 'login-username-error' : undefined"
        />
        <p v-if="fields.username" id="login-username-error" class="field-error">{{ fields.username }}</p>
      </div>

      <div class="field">
        <label for="login-password">Mot de passe</label>
        <PasswordInput
          id="login-password"
          v-model="form.password"
          autocomplete="current-password"
          :invalid="Boolean(fields.password)"
          :describedby="fields.password ? 'login-password-error' : undefined"
        />
        <p v-if="fields.password" id="login-password-error" class="field-error">{{ fields.password }}</p>
      </div>

      <button class="button button--wide" type="submit" :disabled="sending">
        {{ sending ? 'Vérification…' : 'Me connecter' }}
      </button>

      <p class="auth-switch">
        Pas encore de compte ?
        <RouterLink :to="signupLink">Créer mon compte</RouterLink>
      </p>

      <details class="auth-forgot">
        <summary>Mot de passe oublié ?</summary>
        <p>
          CyberLingo ne te demande pas d’adresse e-mail : on ne peut donc pas t’envoyer de lien pour le changer.
          Il te faudra créer un nouveau compte, avec un autre pseudo. Pour la prochaine fois, un gestionnaire de mots
          de passe s’en souvient à ta place.
        </p>
      </details>
    </form>
  </div>
</template>

<style scoped>
.auth {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: start;
  max-width: 920px;
}

.auth-scene {
  position: sticky;
  top: 16px;
  min-height: 360px;
}

.auth-form {
  display: grid;
  gap: 18px;
}

.auth-title {
  font-size: clamp(2rem, 6vw, 2.8rem);
  font-weight: 900;
  font-stretch: 110%;
}

.auth-problem {
  padding: 0.6em 0.8em;
  font-weight: 600;
  color: var(--alert);
  background: var(--alert-pale);
  border: 2px solid var(--alert);
}

.auth-switch {
  text-align: center;
}

.auth-forgot {
  font-size: 0.95rem;
  border-top: 2px solid var(--rule);
  padding-top: 12px;
}

.auth-forgot summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--toque);
}

.auth-forgot p {
  margin-top: 8px;
  color: var(--muted);
}

@media (max-width: 760px) {
  .auth {
    grid-template-columns: 1fr;
  }

  .auth-scene {
    position: static;
    min-height: 0;
  }
}
</style>
