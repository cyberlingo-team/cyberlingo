<script setup>
// Créer son compte, sur le modèle de la copie de référence : un pseudo et un mot de passe, rien
// d'autre. Les règles (longueurs, seuil de robustesse) viennent du serveur, qui les vérifie de
// son côté.
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthScene from '../components/account/AuthScene.vue'
import PasswordInput from '../components/account/PasswordInput.vue'
import PasswordMeter from '../components/account/PasswordMeter.vue'
import { getAccountRules } from '../api/index.js'
import { signup } from '../lib/session.js'
import { showFlash } from '../lib/flash.js'
import { claimedMessage } from '../lib/claimed.js'
import { safeRedirect } from '../lib/navigation.js'
import { useResource } from '../lib/resource.js'

const route = useRoute()
const router = useRouter()

const { data: rules } = useResource(getAccountRules)
const usernameRules = computed(() => rules.value?.username || { minLength: 3, maxLength: 30 })

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
  <AuthScene title="Crée ton profil" :switch-to="loginLink" switch-label="Connexion">
    <p class="auth-kept">Ce que tu as déjà fait sans profil (leçons, mission du jour, sardines) est gardé et passe sur ton profil.</p>

    <form novalidate @submit.prevent="submit">
      <input
        id="signup-username"
        v-model="form.username"
        type="text"
        aria-label="Pseudo"
        placeholder="Pseudo"
        autocomplete="username"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        :maxlength="usernameRules.maxLength"
        :aria-invalid="fields.username ? 'true' : undefined"
        aria-describedby="signup-username-hint"
      />
      <p v-if="fields.username" class="cl-form-error" role="alert">{{ fields.username }}</p>
      <p id="signup-username-hint" class="cl-age-help">
        {{ usernameRules.minLength }} à {{ usernameRules.maxLength }} caractères : lettres, chiffres, point, tiret et tiret
        bas. Il s’affiche au classement, alors évite ton nom complet.
      </p>

      <PasswordInput
        id="signup-password"
        v-model="form.password"
        autocomplete="new-password"
        :maxlength="rules?.password.maxLength"
        :invalid="Boolean(fields.password)"
        describedby="signup-password-meter signup-password-hint"
      />
      <p v-if="fields.password" class="cl-form-error" role="alert">{{ fields.password }}</p>
      <PasswordMeter id="signup-password-meter" :password="form.password" :rules="rules?.password" />
      <p id="signup-password-hint" class="cl-age-help">
        Le plus simple : une phrase de passe d’au moins 7 mots, que toi seul comprends. Sinon, 12 caractères qui mêlent
        majuscules, minuscules, chiffres et signes. Et un mot de passe différent pour chaque site.
      </p>

      <p v-if="problem" class="cl-form-error" role="alert">{{ problem }}</p>
      <button class="cl-button green" type="submit" :disabled="sending">{{ sending ? 'Création…' : 'Créer mon profil' }}</button>
    </form>

    <div class="cl-auth-terms">
      <p>
        Ton mot de passe est haché et salé avant d’être enregistré : même nous, on ne peut pas le lire. Le site ne dépose
        qu’un cookie, celui de ta session.
      </p>
      <p>Déjà un profil ? <RouterLink :to="loginLink">Se connecter</RouterLink></p>
    </div>
  </AuthScene>
</template>

<style scoped>
.auth-kept {
  margin: -12px 0 20px;
  padding: 12px 14px;
  font-size: 15px;
  line-height: 20px;
  text-align: left;
  color: var(--toque);
  background: var(--toque-pale);
  border: 2px solid var(--toque-line);
  border-radius: 12px;
}

.cl-form-error {
  margin-top: -4px;
  text-align: left;
}

.cl-auth-terms a {
  font-weight: 800;
  color: var(--toque-bright);
}
</style>
