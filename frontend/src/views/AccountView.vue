<script setup>
// Mon compte : changer de pseudo, de mot de passe, se déconnecter, supprimer son compte. La mise
// en page reprend le compte de la copie de référence : des formulaires sous des titres de
// section, et la suppression confirmée dans une fenêtre. La page n'est atteignable que connecté
// (voir le routeur).
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SettingsFrame from '../components/account/SettingsFrame.vue'
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
    showFlash('Tu es déconnecté. À demain pour la mission du jour !')
    router.push('/')
  } catch (error) {
    leaveProblem.value = error.unreachable ? UNREACHABLE : error.message
  } finally {
    leaving.value = false
  }
}

const removal = useForm({ password: '' })
const confirming = ref(false)

// La fenêtre de confirmation prend le focus en s'ouvrant et le rend au bouton en se fermant.
async function openRemoval() {
  confirming.value = true
  await nextTick()
  document.getElementById('account-delete-password')?.focus()
}

async function closeRemoval() {
  confirming.value = false
  removal.values.password = ''
  removal.fields = {}
  removal.problem = ''
  await nextTick()
  document.getElementById('account-delete-open')?.focus()
}

function submitRemoval() {
  return run(removal, async () => {
    await deleteAccount(removal.values.password)
    setSessionUser(null)
    showFlash('Ton profil est supprimé, avec ton Tux, tes points et tes réponses.')
    router.push('/')
  })
}
</script>

<template>
  <SettingsFrame title="Mon compte">
    <p v-if="user" class="account-lead">
      Connecté en tant que <strong>{{ user.username }}</strong>. <RouterLink to="/mon-tux">Revenir à mon Tux</RouterLink>
    </p>

    <h2>Changer de pseudo</h2>
    <form novalidate @submit.prevent="submitRename">
      <div class="account-field">
        <label for="account-username">Nouveau pseudo</label>
        <input
          id="account-username"
          v-model="rename.values.username"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :maxlength="rules?.username.maxLength || 30"
          :aria-invalid="rename.fields.username ? 'true' : undefined"
          aria-describedby="account-username-hint"
        />
        <p v-if="rename.fields.username" class="cl-form-error" role="alert">{{ rename.fields.username }}</p>
        <p id="account-username-hint" class="account-hint">
          {{ rules?.username.minLength || 3 }} à {{ rules?.username.maxLength || 30 }} caractères : lettres, chiffres,
          point, tiret et tiret bas. Tes points et ta série te suivent.
        </p>
      </div>
      <p v-if="rename.problem" class="cl-form-error" role="alert">{{ rename.problem }}</p>
      <p v-if="rename.done" class="account-done" role="status">{{ rename.done }}</p>
      <button class="cl-button blue" type="submit" :disabled="rename.sending || rename.values.username.trim() === user?.username">
        {{ rename.sending ? 'Enregistrement…' : 'Changer de pseudo' }}
      </button>
    </form>

    <h2>Changer de mot de passe</h2>
    <form novalidate @submit.prevent="submitPassword">
      <!-- Le pseudo, invisible, aide les gestionnaires de mots de passe à ranger le nouveau. -->
      <input class="visually-hidden" type="text" name="username" autocomplete="username" :value="user?.username" tabindex="-1" aria-hidden="true" readonly />
      <div class="account-field">
        <label for="account-current">Mot de passe actuel</label>
        <PasswordInput
          id="account-current"
          v-model="password.values.currentPassword"
          label="Mot de passe actuel"
          autocomplete="current-password"
          :invalid="Boolean(password.fields.currentPassword)"
        />
        <p v-if="password.fields.currentPassword" class="cl-form-error" role="alert">{{ password.fields.currentPassword }}</p>
      </div>
      <div class="account-field">
        <label for="account-new">Nouveau mot de passe</label>
        <PasswordInput
          id="account-new"
          v-model="password.values.newPassword"
          label="Nouveau mot de passe"
          placeholder="Nouveau mot de passe"
          autocomplete="new-password"
          :maxlength="rules?.password.maxLength"
          :invalid="Boolean(password.fields.newPassword)"
          describedby="account-new-meter"
        />
        <p v-if="password.fields.newPassword" class="cl-form-error" role="alert">{{ password.fields.newPassword }}</p>
        <PasswordMeter id="account-new-meter" :password="password.values.newPassword" :rules="rules?.password" />
      </div>
      <p v-if="password.problem" class="cl-form-error" role="alert">{{ password.problem }}</p>
      <p v-if="password.done" class="account-done" role="status">{{ password.done }}</p>
      <button class="cl-button blue" type="submit" :disabled="password.sending">
        {{ password.sending ? 'Enregistrement…' : 'Changer de mot de passe' }}
      </button>
    </form>

    <h2>Session</h2>
    <p class="account-text">Sur un ordinateur partagé, déconnecte-toi en partant : la session reste ouverte sinon.</p>
    <p v-if="leaveProblem" class="cl-form-error" role="alert">{{ leaveProblem }}</p>
    <button class="cl-button" type="button" :disabled="leaving" @click="leave">
      {{ leaving ? 'Déconnexion…' : 'Se déconnecter' }}
    </button>

    <h2>Supprimer mon compte</h2>
    <p class="account-text">
      Ton pseudo, ton mot de passe, tes réponses, tes points et ton Tux sont effacés pour de bon. Personne ne pourra les
      récupérer, pas même nous.
    </p>
    <button id="account-delete-open" class="cl-button" type="button" @click="openRemoval">Supprimer mon compte</button>

    <div v-if="confirming" class="cl-modal-backdrop" @click.self="closeRemoval" @keydown.esc="closeRemoval">
      <form
        class="cl-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-delete-title"
        novalidate
        @submit.prevent="submitRemoval"
      >
        <h2 id="account-delete-title">Supprimer ton compte ?</h2>
        <p>Ton Tux, tes points et tes réponses seront définitivement effacés. Pour confirmer, tape ton mot de passe.</p>
        <PasswordInput
          id="account-delete-password"
          v-model="removal.values.password"
          autocomplete="current-password"
          :invalid="Boolean(removal.fields.password)"
        />
        <p v-if="removal.fields.password" class="cl-form-error" role="alert">{{ removal.fields.password }}</p>
        <p v-if="removal.problem" class="cl-form-error" role="alert">{{ removal.problem }}</p>
        <button class="cl-button blue" type="button" @click="closeRemoval">Garder mon compte</button>
        <button class="cl-button red" type="submit" :disabled="removal.sending">
          {{ removal.sending ? 'Suppression…' : 'Confirmer la suppression' }}
        </button>
      </form>
    </div>
  </SettingsFrame>
</template>

<style scoped>
.account-lead {
  margin-top: -32px;
  font-size: 17px;
  color: var(--muted);
}

.account-lead a,
.account-text a {
  font-weight: 700;
  color: var(--toque-bright);
}

form:not(.cl-dialog) {
  justify-items: start;
}

.account-field {
  display: grid;
  gap: 8px;
  justify-self: stretch;
}

/* Le libellé au-dessus, le champ dessous : la marge de la copie de référence fait doublon. */
.account-field input,
.account-field :deep(input),
.cl-dialog :deep(input) {
  margin-top: 0;
}

.account-hint {
  font-size: 15px;
  line-height: 20px;
  color: var(--muted);
}

.account-done {
  padding: 12px 14px;
  font-weight: 700;
  color: var(--success-ink);
  background: var(--success-pale);
  border-radius: 12px;
}

.account-text {
  max-width: 600px;
  margin-bottom: 20px;
  color: var(--muted);
}

/* Dans la fenêtre, le titre n'a pas le filet des titres de section. */
.cl-app .cl-dialog h2 {
  margin: 0;
  padding: 0;
  font-size: 24px;
  color: var(--ink);
  border: 0;
}

.cl-app .cl-dialog .cl-button {
  padding-inline: 16px;
}

.cl-app .cl-dialog .cl-button.red {
  color: #fff;
}

.cl-dialog .cl-form-error {
  margin-top: -8px;
  text-align: left;
}

@media (max-width: 699px) {
  .account-lead {
    margin-top: -16px;
  }

  form .cl-button,
  .cl-dialog .cl-button {
    width: 100%;
  }
}
</style>
