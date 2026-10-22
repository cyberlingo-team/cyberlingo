<script setup>
// Se connecter avec son pseudo et son mot de passe. La réponse du serveur dépose le cookie de
// session ; l'interface, elle, ne voit jamais de jeton.
import { computed, reactive, ref, watch } from 'vue'
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

// Une erreur ne vaut que pour la valeur envoyée : dès qu'on retouche le champ, elle s'efface.
for (const name of ['username', 'password']) {
  watch(
    () => form[name],
    () => {
      delete fields.value[name]
    },
  )
}

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
  <AuthScene :image="sceneImage('prof-magnifier')">
    <template #top>
      <RouterLink :to="signupLink" class="button button--ghost button--small">Créer un profil</RouterLink>
    </template>
    <template #line>Avant d’entrer, je vérifie : ton pseudo et ton mot de passe, s’il te plaît.</template>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <h1 class="auth-title">Se connecter</h1>

      <p v-if="problem" class="form-problem" role="alert">{{ problem }}</p>

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

      <button class="button button--blue button--wide" type="submit" :disabled="sending">
        {{ sending ? 'Vérification…' : 'Me connecter' }}
      </button>

      <p class="auth-switch">
        Pas encore de profil ?
        <RouterLink :to="signupLink">Créer un profil</RouterLink>
      </p>

      <details class="auth-forgot">
        <summary>Mot de passe oublié ?</summary>
        <p>
          CyberLingo ne te demande pas d’adresse e-mail : on ne peut donc pas t’envoyer de lien pour le changer.
          Il te faudra créer un nouveau profil, avec un autre pseudo. Pour la prochaine fois, un gestionnaire de mots
          de passe s’en souvient à ta place.
        </p>
      </details>
    </form>
  </AuthScene>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: 18px;
}

.auth-title {
  font-size: 1.8rem;
  text-align: center;
}

.auth-switch {
  text-align: center;
  color: var(--muted);
}

.auth-forgot {
  padding-top: 14px;
  font-size: 0.95rem;
  border-top: 2px solid var(--rule);
}

.auth-forgot summary {
  cursor: pointer;
  font-weight: 800;
  color: var(--toque-bright);
}

.auth-forgot p {
  margin-top: 8px;
  color: var(--muted);
}
</style>
