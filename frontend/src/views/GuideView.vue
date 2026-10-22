<script setup>
// Le guide d'un thème : ses réflexes, une carte par leçon, et les sources pour aller plus loin.
// On peut le lire avant de commencer le thème comme pour réviser après.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import StatePanel from '../components/app/StatePanel.vue'
import { getUnitGuide } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { villainImage } from '../lib/images.js'
import { unitStyle } from '../lib/units.js'
import { typo } from '../lib/format.js'

const route = useRoute()

// Le guide dit aussi quel déguisement Léopold porte dans ce thème.
const { data, error, reload } = useResource(async () => {
  const guide = await getUnitGuide(route.params.unit)
  return { ...guide, villain: guide.unit.villain || null }
})

const missing = computed(() => error.value?.status === 404)
</script>

<template>
  <AppShell>
    <div v-if="missing" class="missing">
      <Icon name="igloo" :size="110" />
      <h1 class="section-title">Ce thème n’existe pas</h1>
      <p class="muted">Le guide que tu cherches n’est pas sur la banquise. Retourne au chemin pour choisir un thème.</p>
      <RouterLink to="/apprendre" class="button">Retour au chemin</RouterLink>
    </div>
    <StatePanel v-else-if="error" state="error" :error="error" :retry="reload" />
    <StatePanel v-else-if="!data" label="On ouvre le guide…" />

    <div v-else class="guide" :style="unitStyle(data.unit.color)">
      <RouterLink to="/apprendre" class="back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Retour au chemin
      </RouterLink>

      <header class="band">
        <div class="band-text">
          <p class="kicker band-kicker">Guide · Thème {{ data.unit.number }}</p>
          <h1 class="band-title">{{ typo(data.unit.title) }}</h1>
          <p class="band-description">{{ typo(data.unit.description) }}</p>
        </div>
        <img v-if="data.villain" :src="villainImage(data.villain).src" alt="" class="band-villain" />
      </header>

      <section class="block" aria-labelledby="reflexes-title">
        <h2 id="reflexes-title" class="section-title">Les bons réflexes</h2>
        <ol class="reflexes">
          <li v-for="(item, index) in data.reflexes" :key="item.title" class="card card--pad reflex">
            <span class="reflex-number" aria-hidden="true">{{ index + 1 }}</span>
            <div class="reflex-text">
              <h3 class="reflex-title">{{ typo(item.title) }}</h3>
              <p>{{ typo(item.moral) }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section v-if="data.sources.length" class="block" aria-labelledby="sources-title">
        <h2 id="sources-title" class="section-title">Pour aller plus loin</h2>
        <ul class="card sources">
          <li v-for="source in data.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener" class="source">
              <span>{{ typo(source.label) }}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <span class="visually-hidden">(nouvel onglet)</span>
            </a>
          </li>
        </ul>
      </section>

      <RouterLink to="/apprendre" class="button button--wide">Retour au chemin</RouterLink>
    </div>
  </AppShell>
</template>

<style scoped>
.guide {
  display: grid;
  gap: 28px;
}

.back {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 6px;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
}

.back svg {
  width: 20px;
  height: 20px;
}

.band {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  min-height: 170px;
  padding: 22px 24px;
  overflow: hidden;
  color: #fff;
  background: var(--unit);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--unit-deep);
}

.band-text {
  display: grid;
  align-self: center;
  gap: 4px;
}

.band-kicker {
  opacity: 0.8;
}

.band-title {
  font-size: clamp(1.5rem, 4vw, 1.9rem);
}

.band-description {
  max-width: 34ch;
  opacity: 0.92;
}

.band-villain {
  flex-shrink: 0;
  width: auto;
  height: 170px;
  margin: 0 -6px -42px 0;
}

.block {
  display: grid;
  gap: 14px;
}

.reflexes {
  display: grid;
  gap: 12px;
  padding: 0;
  list-style: none;
}

.reflex {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.reflex-number {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  font-weight: 900;
  color: #fff;
  background: var(--unit);
  border-radius: 50%;
  box-shadow: 0 3px 0 var(--unit-deep);
}

.reflex-text {
  display: grid;
  gap: 4px;
}

.reflex-title {
  font-size: 1.1rem;
  color: var(--unit-deep);
}

.sources {
  display: grid;
  padding: 0;
  list-style: none;
}

.sources li + li {
  border-top: 2px solid var(--rule);
}

.source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
}

.source svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.missing {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 48px 0;
  text-align: center;
}

@media (max-width: 520px) {
  .band {
    padding: 18px;
  }

  .band-villain {
    height: 130px;
    margin-right: -14px;
  }
}
</style>
