<script setup>
// Créer son compte : un pseudo et un mot de passe, rien d'autre. Les règles (longueurs, seuil de
// robustesse) viennent du serveur, qui les vérifie de son côté.
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthScene from '../components/account/AuthScene.vue'
import PasswordInput from '../components/account/PasswordInput.vue'
import PasswordMeter from '../components/account/PasswordMeter.vue'
import { getAccountRules } from '../api/index.js'
import { signup } from '../lib/session.js'
import { showFlash } from '../lib/flash.js'
import { claimedMessage } from '../lib/claimed.js'
import { safeRedirect } from '../lib/navigation.js'
import { sceneImage } from '../lib/images.js'
import { useResource } from '../lib/resource.js'

const route = useRoute()
const router = useRouter()

const { data: rules } = useResource(getAccountRules)
const usernameRules = computed(() => rules.value?.username || { minLength: 3, maxLength: 30 })

const form = reactive({ username: '', password: '' })
const fields = ref({})
const problem = ref('')
const sending = ref(false)

const loginLink = computed(() => (route.query.redirect ? { path: '/connexion', query: { redirect: route.query.redirect } } : '/connexion'))

async function submit() {
  if (sending.value) return
  fields.value = {}
  problem.value = ''
  sending.value = true
  try {
    const { user, claimed } = await signup(form.username.trim(), form.password)
    showFlash([`Bienvenue, ${user.username} : ton Tux vient d’éclore.`, claimedMessage(claimed)].filter(Boolean).join(' '))
    router.push(safeRedirect(route.query.redirect))
  } catch (error) {
    if (error.status === 400 || error.status === 409) fields.value = error.fields
    else if (error.unreachable) problem.value = 'Le serveur ne répond pas. Vérifie ta connexion à Internet, puis réessaie.'
    else problem.value = error.message
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="page page--wide auth">
    <AuthScene :image="sceneImage('egg')" class="auth-scene">
      Un pseudo, un mot de passe, et ton Tux éclot. Pas d’adresse e-mail, pas de nom.
    </AuthScene>

    <form class="auth-form panel panel--pad" novalidate @submit.prevent="submit">
      <h1 class="auth-title">Créer mon compte</h1>

      <p v-if="problem" class="auth-problem" role="alert">{{ problem }}</p>

      <div class="field">
        <label for="signup-username">Pseudo</label>
        <input
          id="signup-username"
          v-model="form.username"
          class="input"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :maxlength="usernameRules.maxLength"
          :aria-invalid="fields.username ? 'true' : undefined"
          aria-describedby="signup-username-hint"
        />
        <p v-if="fields.username" class="field-error" role="alert">{{ fields.username }}</p>
        <p id="signup-username-hint" class="field-hint">
          {{ usernameRules.minLength }} à {{ usernameRules.maxLength }} caractères : lettres, chiffres, point, tiret et
          tiret bas. Il s’affiche au classement, alors évite ton nom complet.
        </p>
      </div>

      <div class="field">
        <label for="signup-password">Mot de passe</label>
        <PasswordInput
          id="signup-password"
          v-model="form.password"
          autocomplete="new-password"
          :maxlength="rules?.password.maxLength"
          :invalid="Boolean(fields.password)"
          describedby="signup-password-meter signup-password-hint"
        />
        <p v-if="fields.password" class="field-error" role="alert">{{ fields.password }}</p>
        <PasswordMeter id="signup-password-meter" :password="form.password" :rules="rules?.password" />
        <p id="signup-password-hint" class="field-hint">
          Le plus simple : une phrase de passe d’au moins 7 mots, que toi seul comprends. Sinon, 12 caractères qui
          mêlent majuscules, minuscules, chiffres et signes. Et un mot de passe différent pour chaque site.
        </p>
      </div>

      <button class="button button--wide" type="submit" :disabled="sending">
        {{ sending ? 'Création…' : 'Créer mon compte' }}
      </button>

      <p class="auth-switch">
        Déjà un compte ?
        <RouterLink :to="loginLink">Se connecter</RouterLink>
      </p>

      <p class="auth-privacy">
        Ton mot de passe est haché et salé avant d’être enregistré : même nous, on ne peut pas le lire. Le site ne
        dépose qu’un cookie, celui de ta session.
      </p>
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

.auth-privacy {
  font-size: 0.92rem;
  color: var(--muted);
  border-top: 2px solid var(--rule);
  padding-top: 12px;
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
