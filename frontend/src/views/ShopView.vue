<script setup>
// La boutique : on y dépense ses sardines pour regonfler ses bouées ou mettre un glaçon de côté
// (il protège la série un jour sans mission). Réservée aux joueurs qui ont un profil.
import { computed, ref } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { buy, getShop } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { setInventory } from '../lib/inventory.js'
import { showFlash } from '../lib/flash.js'
import { playSound } from '../lib/sound.js'
import { formatNumber, plural, typo } from '../lib/format.js'

const { data, error, reload } = useResource(getShop)

// Sans profil, le serveur répond 401 : on invite à en créer un plutôt que d'afficher une erreur.
const guest = computed(() => error.value?.code === 'not_authenticated')

const ICONS = { bouees: 'bouee', glacon: 'glacon' }
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
    <div class="shop-page">
      <header class="head">
        <div class="head-text">
          <h1 class="head-title">Boutique</h1>
          <p class="muted">Tes sardines s’échangent ici contre de quoi tenir sur la banquise.</p>
        </div>
        <p v-if="data" class="balance">
          <Icon name="sardine" :size="54" />
          <span class="balance-count">{{ formatNumber(data.sardines) }}</span>
          <span class="visually-hidden">sardines</span>
        </p>
      </header>

      <section v-if="guest" class="guest card card--pad">
        <Icon name="etal" :size="120" />
        <h2 class="guest-title">Crée un profil pour utiliser la boutique</h2>
        <p class="muted">Avec un profil, tes leçons, tes coffres et tes quêtes te rapportent des sardines à dépenser ici.</p>
        <div class="guest-actions">
          <RouterLink class="button" :to="{ path: '/inscription', query: { redirect: '/boutique' } }">Créer un profil</RouterLink>
          <RouterLink class="button button--ghost" :to="{ path: '/connexion', query: { redirect: '/boutique' } }">Se connecter</RouterLink>
        </div>
      </section>
      <StatePanel v-else-if="error && !data" state="error" :error="error" :retry="reload" />
      <StatePanel v-else-if="!data" label="On ouvre l’étal…" />

      <section v-else aria-labelledby="items-title" class="block">
        <h2 id="items-title" class="section-title">Bouées et glaçons</h2>
        <ul class="items">
          <li v-for="item in data.items" :key="item.id" class="item card">
            <Icon :name="ICONS[item.id] || 'etal'" :size="72" />
            <div class="item-text">
              <p class="item-title">{{ typo(item.title) }}</p>
              <p class="item-description">{{ typo(item.description) }}</p>
              <p class="item-owned">
                {{ item.id === 'glacon' ? 'En réserve' : 'Bouées' }} : <strong>{{ item.owned.count }} / {{ item.owned.max }}</strong>
              </p>
              <p v-if="item.reason" class="item-reason">{{ typo(item.reason) }}</p>
            </div>
            <button
              type="button"
              class="button item-buy"
              :disabled="!item.available || buying !== null"
              :aria-label="`Acheter ${item.title} pour ${plural(item.price, 'sardine')}`"
              @click="purchase(item)"
            >
              <Icon name="sardine" :size="30" />
              <span>{{ buying === item.id ? 'Achat…' : formatNumber(item.price) }}</span>
            </button>
          </li>
        </ul>
        <p class="block-note muted">Pour gagner des sardines : finis des leçons (sans faute, c’est mieux), ouvre les coffres du chemin et remplis tes quêtes.</p>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.shop-page {
  display: grid;
  gap: 28px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.head-text {
  display: grid;
  gap: 4px;
}

.head-title {
  font-size: 1.8rem;
}

.balance {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: var(--toque-pale);
  border: 2px solid var(--toque-line);
  border-radius: var(--radius);
}

.balance-count {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--toque-bright);
}

.block {
  display: grid;
  gap: 14px;
}

.items {
  display: grid;
  gap: 14px;
  padding: 0;
  list-style: none;
}

.item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 18px 20px;
}

.item-text {
  display: grid;
  gap: 4px;
}

.item-title {
  font-size: 1.15rem;
  font-weight: 800;
}

.item-description {
  font-size: 0.95rem;
  color: var(--muted);
}

.item-owned {
  font-size: 0.9rem;
}

.item-reason {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--beak-ink);
}

.item-buy {
  --face: var(--paper);
  --edge: var(--rule-strong);
  --text: var(--toque-bright);
  min-width: 128px;
  border: 2px solid var(--rule-strong);
  font-size: 1.05rem;
}

.item-buy:hover {
  filter: none;
  background: var(--wash);
}

.item-buy:disabled {
  --face: #eef0f5;
  --edge: #d3d7e2;
  --text: #9aa0b4;
  border-color: #d3d7e2;
}

.item-buy:disabled :deep(.icon) {
  filter: grayscale(1) opacity(0.6);
}

.block-note {
  font-size: 0.92rem;
}

.guest {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.guest-title {
  font-size: 1.35rem;
}

.guest .muted {
  max-width: 44ch;
}

.guest-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 6px;
}

@media (max-width: 560px) {
  .head {
    flex-direction: column;
    align-items: flex-start;
  }

  .head-title {
    font-size: 1.5rem;
  }

  .item {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px 14px;
    padding: 16px;
  }

  .item :deep(.icon:first-child) {
    width: 56px !important;
    height: 56px !important;
  }

  .item-buy {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
