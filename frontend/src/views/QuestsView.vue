<script setup>
// Les quêtes, à la manière de la copie de référence : trois petits objectifs par jour au centre,
// le défi du mois à droite (sur téléphone, un onglet). Chacune réussie remplit la réserve de
// sardines, sans rien avoir à réclamer.
import { computed, ref } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import QuestCard from '../components/app/QuestCard.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { getQuests } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { sceneImage } from '../lib/images.js'
import { plural, typo, untilMidnight } from '../lib/format.js'

const { data, error, reload } = useResource(getQuests)

const banner = sceneImage('quetes')
const monthly = computed(() => data.value?.monthly || null)
const allDone = computed(() => data.value?.daily.every((quest) => quest.done) ?? false)

// Sur téléphone, la colonne de droite disparaît : le défi du mois passe dans un onglet.
const tab = ref('daily')
</script>

<template>
  <AppShell>
    <div class="cl-quests-page">
      <nav class="cl-quest-tabs" aria-label="Quêtes">
        <button type="button" :class="{ active: tab === 'daily' }" :aria-pressed="tab === 'daily'" @click="tab = 'daily'">Quêtes</button>
        <button type="button" :class="{ active: tab === 'monthly' }" :aria-pressed="tab === 'monthly'" @click="tab = 'monthly'">Défi du mois</button>
      </nav>

      <div :class="{ 'is-mobile-hidden': tab !== 'daily' }">
        <header class="cl-quest-welcome">
          <div>
            <h1>Quêtes</h1>
            <p>Remplis tes quêtes chaque jour pour gagner des sardines, et dépense-les à la boutique !</p>
          </div>
          <img :src="banner.src" alt="" />
        </header>

        <StatePanel v-if="error && !data" state="error" :error="error" :retry="reload" />
        <StatePanel v-else-if="!data" label="Chargement des quêtes…" />
        <template v-else>
          <div class="cl-section-heading">
            <h2>Quêtes du jour</h2>
            <span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              <span class="visually-hidden">Nouvelles quêtes dans</span>{{ untilMidnight() }}
            </span>
          </div>
          <div class="cl-panel">
            <QuestCard v-for="quest in data.daily" :key="quest.id" :quest="quest" />
          </div>
          <div class="cl-locked-quest">
            <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="21" width="30" height="22" rx="6" fill="currentColor" /><path d="M16 21v-5a8 8 0 0 1 16 0v5" fill="none" stroke="currentColor" stroke-width="5" /></svg>
            <strong>{{ allDone ? 'Bravo ! Trois nouvelles quêtes demain' : 'Nouvelles quêtes demain' }}</strong>
          </div>
        </template>
      </div>

      <!-- Le défi du mois, ici seulement quand la colonne de droite n'est pas affichée. -->
      <section v-if="monthly" class="cl-panel cl-monthly monthly-main" :class="{ 'is-mobile-hidden': tab !== 'monthly' }" aria-labelledby="monthly-main-title">
        <Icon name="trophee" :size="96" />
        <strong id="monthly-main-title">{{ typo(monthly.title) }}</strong>
        <p>{{ typo(monthly.description) }} {{ monthly.done ? 'Défi réussi !' : `Encore ${plural(monthly.daysLeft, 'jour')}.` }}</p>
        <div class="cl-quest-progress" role="progressbar" :aria-valuenow="monthly.value" aria-valuemin="0" :aria-valuemax="monthly.goal" :aria-label="typo(monthly.title)">
          <span :style="{ width: `${Math.min(100, (monthly.value / monthly.goal) * 100)}%` }"></span><b>{{ monthly.value }} / {{ monthly.goal }}</b>
        </div>
        <p class="monthly-reward"><Icon name="sardine" :size="30" />Récompense : {{ plural(monthly.reward, 'sardine') }}</p>
        <RouterLink class="cl-button" to="/apprendre">Commencer une leçon</RouterLink>
      </section>
    </div>

    <template #aside>
      <section v-if="monthly" class="cl-panel cl-monthly monthly-aside" aria-labelledby="monthly-title">
        <Icon name="trophee" :size="96" />
        <strong id="monthly-title">{{ typo(monthly.title) }}</strong>
        <p>{{ typo(monthly.description) }} {{ monthly.done ? 'Défi réussi !' : `Encore ${plural(monthly.daysLeft, 'jour')}.` }}</p>
        <div class="cl-quest-progress" role="progressbar" :aria-valuenow="monthly.value" aria-valuemin="0" :aria-valuemax="monthly.goal" :aria-label="typo(monthly.title)">
          <span :style="{ width: `${Math.min(100, (monthly.value / monthly.goal) * 100)}%` }"></span><b>{{ monthly.value }} / {{ monthly.goal }}</b>
        </div>
        <p class="monthly-reward"><Icon name="sardine" :size="30" />Récompense : {{ plural(monthly.reward, 'sardine') }}</p>
        <RouterLink class="cl-button" to="/apprendre">Commencer une leçon</RouterLink>
      </section>
    </template>
  </AppShell>
</template>

<style scoped>
.cl-quest-welcome img {
  object-fit: contain;
  object-position: bottom;
  margin-left: auto;
}

.cl-section-heading > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cl-section-heading svg {
  width: 16px;
  height: 16px;
}

.cl-quests-page > div > .cl-panel {
  padding: 0;
}

.cl-panel .cl-quest-card + .cl-quest-card {
  border-top: 2px solid var(--rule);
}

.cl-locked-quest {
  margin-top: 16px;
}

.cl-locked-quest svg {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: #c3c8d6;
}

.cl-monthly :deep(.icon:first-child) {
  float: right;
  margin: -10px -6px 12px 12px;
}

.cl-monthly .cl-quest-progress {
  clear: both;
}

.monthly-reward {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 20px !important;
  font-weight: 700;
}

.cl-monthly .cl-button {
  width: 100%;
}

/* Le défi dans la colonne principale : seulement quand la colonne de droite est masquée. */
.monthly-main {
  display: none;
  margin-top: 24px;
}

@media (max-width: 1079px) {
  .monthly-main {
    display: block;
  }
}

@media (min-width: 700px) and (max-width: 1079px) {
  .monthly-aside {
    display: none;
  }
}

@media (max-width: 699px) {
  .cl-quest-tabs {
    margin-bottom: 16px;
  }

  .is-mobile-hidden {
    display: none !important;
  }

  .monthly-main {
    margin-top: 0;
  }
}
</style>
