<script setup>
// Mon compte : changer de pseudo, de mot de passe, se déconnecter, supprimer son compte.
// La page n'est atteignable que connecté (voir le routeur).
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PasswordInput from '../components/account/PasswordInput.vue'
import PasswordMeter from '../components/account/PasswordMeter.vue'
import { changePassword, deleteAccount, getAccountRules, renameMe } from '../api/index.js'
import { logout, session, setSessionUser } from '../lib/session.js'
import { showFlash } from '../lib/flash.js'
import { useResource } from '../lib/resource.js'

const router = useRouter()
const { data: rules } = useResource(getAccountRules)
const user = computed(() => session.user)

const UNREACHABLE = 'Le serveur ne répond pas. Vérifie ta connexion à Internet, puis réessaie.'

// Chaque formulaire a ses champs, ses erreurs et son message de réussite. Une erreur ne vaut que
// pour la valeur envoyée : dès qu'on retouche le champ, elle s'efface.
function useForm(initial) {
  const form = reactive({ values: { ...initial }, fields: {}, problem: '', done: '', sending: false })
  for (const name of Object.keys(initial)) {
    watch(
      () => form.values[name],
      () => {
        delete form.fields[name]
      },
    )
  }
  return form
}

async function run(form, action) {
  if (form.sending) return
  form.fields = {}
  form.problem = ''
  form.done = ''
  form.sending = true
  try {
    await action()
  } catch (error) {
    if (error.status === 401) {
      router.push({ path: '/connexion', query: { redirect: '/mon-compte' } })
    } else if (error.fields && Object.keys(error.fields).length) {
      form.fields = error.fields
    } else {
      form.problem = error.unreachable ? UNREACHABLE : error.message
    }
  } finally {
    form.sending = false
  }
}

const rename = useForm({ username: session.user?.username || '' })

function submitRename() {
  return run(rename, async () => {
    const { user: updated } = await renameMe(rename.values.username.trim())
    setSessionUser(updated)
    rename.values.username = updated.username
    rename.done = `C’est fait : au classement, tu t’appelles maintenant ${updated.username}.`
  })
}

const password = useForm({ currentPassword: '', newPassword: '' })

function submitPassword() {
  return run(password, async () => {
    await changePassword(password.values.currentPassword, password.values.newPassword)
    password.values.currentPassword = ''
    password.values.newPassword = ''
    password.done = 'Mot de passe changé. Pense à le mettre à jour dans ton gestionnaire de mots de passe.'
  })
}

const leaving = ref(false)
const leaveProblem = ref('')

async function leave() {
  leaving.value = true
  leaveProblem.value = ''
  try {
    await logout()
    showFlash('Tu es déconnecté. Le prochain épisode sort à minuit.')
    router.push('/')
  } catch (error) {
    leaveProblem.value = error.unreachable ? UNREACHABLE : error.message
  } finally {
    leaving.value = false
  }
}

const removal = useForm({ password: '' })
const confirming = ref(false)

function submitRemoval() {
  return run(removal, async () => {
    await deleteAccount(removal.values.password)
    setSessionUser(null)
    showFlash('Ton compte est supprimé, avec ton Tux, tes points et tes réponses.')
    router.push('/')
  })
}
</script>

<template>
  <div class="page account">
    <h1 class="page-title">Mon compte</h1>
    <p v-if="user" class="lead">
      Connecté en tant que <strong>{{ user.username }}</strong>. <RouterLink to="/mon-tux">Revenir à mon Tux</RouterLink>
    </p>

    <form class="panel panel--pad account-form" novalidate @submit.prevent="submitRename">
      <h2 class="account-title">Changer de pseudo</h2>
      <div class="field">
        <label for="account-username">Nouveau pseudo</label>
        <input
          id="account-username"
          v-model="rename.values.username"
          class="input"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :maxlength="rules?.username.maxLength || 30"
          :aria-invalid="rename.fields.username ? 'true' : undefined"
          aria-describedby="account-username-hint"
        />
        <p v-if="rename.fields.username" class="field-error" role="alert">{{ rename.fields.username }}</p>
        <p id="account-username-hint" class="field-hint">
          {{ rules?.username.minLength || 3 }} à {{ rules?.username.maxLength || 30 }} caractères : lettres, chiffres,
          point, tiret et tiret bas. Tes points et ta série te suivent.
        </p>
      </div>
      <p v-if="rename.problem" class="form-problem" role="alert">{{ rename.problem }}</p>
      <p v-if="rename.done" class="form-done" role="status">{{ rename.done }}</p>
      <button class="button" type="submit" :disabled="rename.sending || rename.values.username.trim() === user?.username">
        {{ rename.sending ? 'Enregistrement…' : 'Changer de pseudo' }}
      </button>
    </form>

    <form class="panel panel--pad account-form" novalidate @submit.prevent="submitPassword">
      <h2 class="account-title">Changer de mot de passe</h2>
      <!-- Le pseudo, invisible, aide les gestionnaires de mots de passe à ranger le nouveau. -->
      <input class="visually-hidden" type="text" name="username" autocomplete="username" :value="user?.username" tabindex="-1" aria-hidden="true" readonly />
      <div class="field">
        <label for="account-current">Mot de passe actuel</label>
        <PasswordInput
          id="account-current"
          v-model="password.values.currentPassword"
          autocomplete="current-password"
          :invalid="Boolean(password.fields.currentPassword)"
        />
        <p v-if="password.fields.currentPassword" class="field-error" role="alert">{{ password.fields.currentPassword }}</p>
      </div>
      <div class="field">
        <label for="account-new">Nouveau mot de passe</label>
        <PasswordInput
          id="account-new"
          v-model="password.values.newPassword"
          autocomplete="new-password"
          :maxlength="rules?.password.maxLength"
          :invalid="Boolean(password.fields.newPassword)"
          describedby="account-new-meter"
        />
        <p v-if="password.fields.newPassword" class="field-error" role="alert">{{ password.fields.newPassword }}</p>
        <PasswordMeter id="account-new-meter" :password="password.values.newPassword" :rules="rules?.password" />
      </div>
      <p v-if="password.problem" class="form-problem" role="alert">{{ password.problem }}</p>
      <p v-if="password.done" class="form-done" role="status">{{ password.done }}</p>
      <button class="button" type="submit" :disabled="password.sending">
        {{ password.sending ? 'Enregistrement…' : 'Changer de mot de passe' }}
      </button>
    </form>

    <section class="panel panel--pad account-form" aria-labelledby="account-logout">
      <h2 id="account-logout" class="account-title">Se déconnecter</h2>
      <p>Sur un ordinateur partagé, déconnecte-toi en partant : la session reste ouverte sinon.</p>
      <p v-if="leaveProblem" class="form-problem" role="alert">{{ leaveProblem }}</p>
      <button class="button button--paper" type="button" :disabled="leaving" @click="leave">
        {{ leaving ? 'Déconnexion…' : 'Me déconnecter' }}
      </button>
    </section>

    <section class="panel panel--pad account-form danger" aria-labelledby="account-delete">
      <h2 id="account-delete" class="account-title">Supprimer mon compte</h2>
      <p>
        Ton pseudo, ton mot de passe, tes réponses, tes points et ton Tux sont effacés pour de bon. Personne ne pourra les
        récupérer, pas même nous.
      </p>
      <button v-if="!confirming" class="button button--danger" type="button" @click="confirming = true">
        Supprimer mon compte
      </button>
      <form v-else class="danger-confirm" novalidate @submit.prevent="submitRemoval">
        <div class="field">
          <label for="account-delete-password">Pour confirmer, ton mot de passe</label>
          <PasswordInput
            id="account-delete-password"
            v-model="removal.values.password"
            autocomplete="current-password"
            :invalid="Boolean(removal.fields.password)"
          />
          <p v-if="removal.fields.password" class="field-error" role="alert">{{ removal.fields.password }}</p>
        </div>
        <p v-if="removal.problem" class="form-problem" role="alert">{{ removal.problem }}</p>
        <div class="danger-actions">
          <button class="button button--danger" type="submit" :disabled="removal.sending">
            {{ removal.sending ? 'Suppression…' : 'Supprimer définitivement' }}
          </button>
          <button class="text-button" type="button" @click="confirming = false">Garder mon compte</button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.account-form {
  display: grid;
  gap: 14px;
  justify-items: start;
}

.account-form .field {
  justify-self: stretch;
  max-width: 460px;
}

.account-title {
  font-size: clamp(1.3rem, 4vw, 1.6rem);
  font-weight: 850;
}

.form-problem {
  padding: 0.5em 0.75em;
  font-weight: 600;
  color: var(--alert-ink);
  background: var(--alert-pale);
  border: 2px solid var(--alert);
}

.form-done {
  padding: 0.5em 0.75em;
  font-weight: 600;
  background: var(--toque-pale);
  border: 2px solid var(--toque);
}

.danger {
  border-color: var(--alert);
}

.danger-confirm {
  display: grid;
  gap: 12px;
  justify-self: stretch;
}

.danger-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
</style>
