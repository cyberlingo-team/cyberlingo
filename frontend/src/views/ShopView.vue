<script setup>
// La boutique, à la manière de la copie de référence : on y dépense ses sardines pour regonfler
// ses bouées ou mettre un glaçon de côté (il protège la série un jour sans mission). Réservée
// aux joueurs qui ont un profil : un visiteur voit l'étal fermé et l'invitation à s'inscrire.
import { computed, ref } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { buy, getShop } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { inventory, loadInventory, setInventory } from '../lib/inventory.js'
import { showFlash } from '../lib/flash.js'
import { playSound } from '../lib/sound.js'
import { formatNumber, plural, typo } from '../lib/format.js'

loadInventory()
const { data, error, reload } = useResource(getShop)

// Sans profil, le serveur répond 401 : on invite à en créer un plutôt que d'afficher une erreur.
const guest = computed(() => error.value?.code === 'not_authenticated')

const ICONS = { bouees: 'bouee', glacon: 'glacon' }
const SECTIONS = { bouees: 'Bouées', glacon: 'Pour ta série' }
const buying = ref(null)

async function purchase(item) {
  if (buying.value) return
  buying.value = item.id
  try {
    const result = await buy(item.id)
    setInventory(result.inventory)
    playSound('correct')
    showFlash(item.id === 'glacon' ? 'Glaçon acheté : ta série est protégée un jour.' : 'Bouées regonflées : à toi de jouer !')
    await reload()
  } catch (cause) {
    showFlash(cause.message)
    await reload()
  } finally {
    buying.value = null
  }
}
</script>

<template>
  <AppShell>
    <div class="cl-shop-page">
      <h1 class="visually-hidden">Boutique</h1>

      <template v-if="guest">
        <div class="cl-shop-signup">
          <p v-if="inventory.data">Tu as gagné {{ plural(inventory.data.sardines, 'sardine') }} ! Crée un profil pour les dépenser dans la boutique !</p>
          <p v-else>Crée un profil pour dépenser tes sardines dans la boutique !</p>
          <RouterLink class="cl-button green" :to="{ path: '/inscription', query: { redirect: '/boutique' } }">Créer un profil</RouterLink>
          <RouterLink class="cl-button signup-login" :to="{ path: '/connexion', query: { redirect: '/boutique' } }">Se connecter</RouterLink>
        </div>
        <!-- L'étal fermé derrière l'invitation. -->
        <div class="cl-shop-locked" aria-hidden="true">
          <h2>Bouées</h2>
          <article class="cl-shop-item">
            <Icon name="bouee" :size="90" />
            <div><span class="skeleton skeleton--title"></span><span class="skeleton"></span><span class="skeleton skeleton--short"></span></div>
          </article>
          <h2>Pour ta série</h2>
          <article class="cl-shop-item">
            <Icon name="glacon" :size="90" />
            <div><span class="skeleton skeleton--title"></span><span class="skeleton"></span><span class="skeleton skeleton--short"></span></div>
          </article>
        </div>
      </template>

      <StatePanel v-else-if="error && !data" state="error" :error="error" :retry="reload" />
      <StatePanel v-else-if="!data" label="On ouvre l’étal…" />

      <template v-else>
        <template v-for="item in data.items" :key="item.id">
          <h2>{{ SECTIONS[item.id] || typo(item.title) }}</h2>
          <article class="cl-shop-item">
            <Icon :name="ICONS[item.id] || 'etal'" :size="90" />
            <div>
              <h3>
                {{ typo(item.title) }}
                <small>{{ item.owned.count }}/{{ item.owned.max }} {{ item.id === 'glacon' ? 'en réserve' : '' }}</small>
              </h3>
              <p>{{ typo(item.description) }}</p>
              <p v-if="item.reason" class="item-reason">{{ typo(item.reason) }}</p>
            </div>
            <button
              type="button"
              class="cl-button"
              :disabled="!item.available || buying !== null"
              :aria-label="item.available ? `Acheter ${item.title} pour ${plural(item.price, 'sardine')}` : undefined"
              @click="purchase(item)"
            >
              <template v-if="buying === item.id">Achat…</template>
              <template v-else-if="!item.available && item.owned.count >= item.owned.max">Au max</template>
              <template v-else>Obtenir pour <Icon name="sardine" :size="26" /> {{ formatNumber(item.price) }}</template>
            </button>
          </article>
        </template>
        <p class="shop-note">Pour gagner des sardines : finis des leçons (sans faute, c’est mieux), ouvre les coffres du chemin et remplis tes quêtes.</p>
      </template>
    </div>
  </AppShell>
</template>

<style scoped>
.cl-shop-page > h2:first-of-type,
.cl-shop-locked > h2:first-of-type {
  border-top: 0;
  padding-top: 8px;
}

.cl-shop-item > :deep(.icon) {
  width: 90px;
  height: 90px;
}

.cl-shop-item > .cl-button {
  gap: 6px;
}

.item-reason {
  margin-top: 8px;
  font-size: 15px !important;
  font-weight: 700;
  color: var(--beak-ink) !important;
}

.shop-note {
  color: var(--muted);
  border-top: 2px solid var(--rule);
  padding-top: 24px;
}

.cl-shop-signup {
  display: grid;
  justify-items: center;
  gap: 12px;
}

.cl-shop-signup p {
  margin-bottom: 18px !important;
}

.cl-shop-locked {
  padding-top: 280px;
}

.signup-login {
  min-width: 344px;
}

.skeleton {
  display: block;
  height: 14px;
  margin-bottom: 12px;
  background: var(--rule);
  border-radius: 8px;
}

.skeleton--title {
  width: 40%;
  height: 20px;
}

.skeleton--short {
  width: 60%;
}

@media (max-width: 699px) {
  .signup-login {
    min-width: 0;
    width: 100%;
  }

  .cl-shop-locked {
    padding-top: 300px;
  }
}
</style>
