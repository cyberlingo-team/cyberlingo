<script setup>
// Se connecter avec son pseudo et son mot de passe, sur le modèle de la copie de référence. La
// réponse du serveur dépose le cookie de session ; l'interface, elle, ne voit jamais de jeton.
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthScene from '../components/account/AuthScene.vue'
import PasswordInput from '../components/account/PasswordInput.vue'
import { login } from '../lib/session.js'
import { showFlash } from '../lib/flash.js'
import { claimedMessage } from '../lib/claimed.js'
import { safeRedirect } from '../lib/navigation.js'

const route = useRoute()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const fields = ref({})
const problem = ref('')
const sending = ref(false)
const forgot = ref(false)

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
  <AuthScene title="Connexion" :switch-to="signupLink" switch-label="Créer un profil">
    <form novalidate @submit.prevent="submit">
      <input
        id="login-username"
        v-model="form.username"
        type="text"
        aria-label="Pseudo"
        placeholder="Pseudo"
        autocomplete="username"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        maxlength="60"
        :aria-invalid="fields.username ? 'true' : undefined"
        :aria-describedby="fields.username ? 'login-username-error' : undefined"
      />
      <p v-if="fields.username" id="login-username-error" class="cl-form-error">{{ fields.username }}</p>
      <PasswordInput
        id="login-password"
        v-model="form.password"
        autocomplete="current-password"
        :invalid="Boolean(fields.password)"
        :describedby="fields.password ? 'login-password-error' : undefined"
      />
      <p v-if="fields.password" id="login-password-error" class="cl-form-error">{{ fields.password }}</p>
      <p v-if="problem" class="cl-form-error" role="alert">{{ problem }}</p>
      <button class="cl-button blue" type="submit" :disabled="sending">{{ sending ? 'Vérification…' : 'Se connecter' }}</button>
    </form>

    <button type="button" class="auth-link" :aria-expanded="forgot" @click="forgot = !forgot">Mot de passe oublié ?</button>
    <p v-if="forgot" class="cl-local-notice" role="status">
      CyberLingo ne te demande pas d’adresse e-mail : on ne peut donc pas t’envoyer de lien pour le changer. Il te
      faudra créer un nouveau profil, avec un autre pseudo. Pour la prochaine fois, un gestionnaire de mots de passe
      s’en souvient à ta place.
    </p>

    <div class="cl-auth-or">ou</div>
    <RouterLink class="cl-button auth-wide" :to="signupLink">Créer un profil</RouterLink>

    <div class="cl-auth-terms">
      <p>Pas de compte Google ni d’adresse e-mail : un pseudo et un mot de passe suffisent.</p>
      <p>Le site ne dépose qu’un cookie, celui de ta session.</p>
    </div>
  </AuthScene>
</template>

<style scoped>
.auth-link {
  margin-top: 20px;
  font: 800 15px var(--font-title);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--toque-bright);
  background: none;
  border: 0;
  cursor: pointer;
}

.cl-local-notice {
  text-align: left;
}

.auth-wide {
  width: 100%;
}

.cl-form-error {
  margin-top: -4px;
  text-align: left;
}
</style>
