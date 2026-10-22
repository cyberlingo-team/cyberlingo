<script setup>
// Les quêtes : trois petits objectifs par jour et un défi pour le mois. Chacune réussie remplit
// la réserve de sardines, sans rien avoir à réclamer.
import { computed } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import AsideCards from '../components/app/AsideCards.vue'
import Icon from '../components/app/Icon.vue'
import QuestList from '../components/app/QuestList.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { getQuests } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { sceneImage } from '../lib/images.js'
import { plural, typo, untilMidnight } from '../lib/format.js'

const { data, error, reload } = useResource(getQuests)

const banner = sceneImage('quetes')
const monthly = computed(() => data.value?.monthly || null)
const doneToday = computed(() => data.value?.daily.filter((quest) => quest.done).length ?? 0)
</script>

<template>
  <AppShell>
    <div class="quests-page">
      <header class="banner">
        <div class="banner-text">
          <h1 class="banner-title">Quêtes</h1>
          <p class="banner-sub">Remplis tes quêtes pour gagner des sardines, et dépense-les à la boutique.</p>
        </div>
        <img :src="banner.src" alt="" class="banner-image" />
      </header>

      <StatePanel v-if="error && !data" state="error" :error="error" :retry="reload" />
      <StatePanel v-else-if="!data" label="Chargement des quêtes…" />

      <template v-else>
        <section class="block" aria-labelledby="daily-title">
          <div class="block-head">
            <h2 id="daily-title" class="section-title">Quêtes du jour</h2>
            <p class="block-clock"><Icon name="glacon" :size="20" />Nouvelles quêtes dans {{ untilMidnight() }}</p>
          </div>
          <div class="card card--pad">
            <QuestList :quests="data.daily" />
          </div>
          <p class="block-note muted">
            {{ doneToday === data.daily.length ? 'Toutes tes quêtes du jour sont faites. Bravo !' : `Quêtes faites aujourd’hui : ${doneToday} sur ${data.daily.length}.` }}
          </p>
        </section>

        <section v-if="monthly" class="block" aria-labelledby="monthly-title">
          <h2 id="monthly-title" class="section-title">Défi du mois</h2>
          <div class="monthly" :class="{ 'is-done': monthly.done }">
            <div class="monthly-band">
              <p class="kicker">{{ monthly.done ? 'Défi réussi' : `Encore ${plural(monthly.daysLeft, 'jour')}` }}</p>
              <p class="monthly-title">{{ typo(monthly.title) }}</p>
            </div>
            <div class="monthly-body">
              <p>{{ typo(monthly.description) }}</p>
              <div class="monthly-progress">
                <div class="meter" role="progressbar" :aria-valuenow="monthly.value" aria-valuemin="0" :aria-valuemax="monthly.goal" :aria-label="typo(monthly.title)">
                  <div class="meter-fill" :data-empty="monthly.value === 0" :style="{ width: `${Math.min(100, (monthly.value / monthly.goal) * 100)}%` }"></div>
                  <span class="meter-text">{{ monthly.value }} / {{ monthly.goal }}</span>
                </div>
                <Icon :name="monthly.done ? 'coffre-ouvert' : 'coffre'" :size="48" />
              </div>
              <p class="monthly-reward"><Icon name="sardine" :size="34" />Récompense : {{ plural(monthly.reward, 'sardine') }}</p>
            </div>
          </div>
        </section>
      </template>
    </div>
    <template #aside><AsideCards :show-quests="false" /></template>
  </AppShell>
</template>

<style scoped>
.quests-page {
  display: grid;
  gap: 28px;
}

.banner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 170px;
  padding: 22px 0 22px 24px;
  overflow: hidden;
  color: #fff;
  background: var(--beak);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--beak-deep);
}

.banner-text {
  display: grid;
  gap: 6px;
  max-width: 34ch;
}

.banner-title {
  font-size: 1.8rem;
}

.banner-sub {
  font-weight: 600;
}

.banner-image {
  align-self: flex-end;
  width: auto;
  height: 190px;
  margin: -10px 12px -40px 0;
}

.block {
  display: grid;
  gap: 12px;
}

.block-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.block-clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--toque-bright);
}

.block-note {
  font-size: 0.92rem;
}

/* Le défi du mois. */
.monthly {
  overflow: hidden;
  border: 2px solid var(--rule);
  border-radius: var(--radius);
}

.monthly-band {
  display: grid;
  gap: 2px;
  padding: 14px 20px;
  color: #fff;
  background: var(--toque);
}

.monthly-band .kicker {
  color: #ffc58a;
}

.monthly-title {
  font-size: 1.3rem;
  font-weight: 900;
}

.monthly-body {
  display: grid;
  gap: 14px;
  padding: 18px 20px;
}

.monthly-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monthly-progress .meter {
  flex: 1;
  height: 22px;
}

.meter-text {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  font-weight: 900;
  color: var(--ink);
}

.monthly.is-done .meter-fill {
  --meter: var(--success);
}

.monthly.is-done .meter-text {
  color: #fff;
}

.monthly-reward {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  color: var(--toque);
}

@media (max-width: 520px) {
  .banner {
    min-height: 140px;
    padding-left: 18px;
  }

  .banner-title {
    font-size: 1.45rem;
  }

  .banner-sub {
    font-size: 0.92rem;
  }

  .banner-image {
    height: 150px;
    margin-right: 4px;
  }
}
</style>
