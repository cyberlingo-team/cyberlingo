<script setup>
// Le guide d'un thème, à la manière du guide d'unité de la copie de référence : les réflexes à
// retenir (un par leçon), puis les sources pour aller plus loin. On peut le lire avant de
// commencer le thème comme pour réviser après.
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

const { data, error, reload } = useResource(() => getUnitGuide(route.params.unit))

const missing = computed(() => error.value?.status === 404)
</script>

<template>
  <AppShell>
    <div v-if="missing" class="cl-guide cl-guide-missing">
      <Icon name="igloo" :size="110" />
      <h1>Ce thème n’existe pas</h1>
      <p>Le guide que tu cherches n’est pas sur la banquise. Retourne au chemin pour choisir un thème.</p>
      <RouterLink to="/apprendre" class="cl-button green">Retour au chemin</RouterLink>
    </div>
    <StatePanel v-else-if="error" state="error" :error="error" :retry="reload" />
    <StatePanel v-else-if="!data" label="On ouvre le guide…" />

    <div v-else class="cl-guide" :style="unitStyle(data.unit.color)">
      <RouterLink to="/apprendre" class="cl-guide-back">← &nbsp;Retour</RouterLink>
      <header>
        <img v-if="data.unit.villain" :src="villainImage(data.unit.villain).src" alt="" class="cl-guide-duo" />
        <div>
          <p class="cl-guide-kicker">Guide du thème {{ data.unit.number }}</p>
          <h1>{{ typo(data.unit.title) }}</h1>
          <p>{{ typo(data.unit.description) }}</p>
        </div>
      </header>

      <h3>Les bons réflexes</h3>
      <ol class="cl-guide-phrases">
        <li v-for="(item, index) in data.reflexes" :key="item.title" class="cl-guide-phrase">
          <span class="cl-guide-number" aria-hidden="true">{{ index + 1 }}</span>
          <div>
            <strong>{{ typo(item.title) }}</strong>
            <p>{{ typo(item.moral) }}</p>
          </div>
        </li>
      </ol>

      <section v-if="data.sources.length" class="cl-guide-tips" aria-labelledby="sources-title">
        <h3>Sources</h3>
        <h2 id="sources-title">Pour aller plus loin</h2>
        <ul class="cl-guide-sources">
          <li v-for="source in data.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener">
              {{ typo(source.label) }}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <span class="visually-hidden">(nouvel onglet)</span>
            </a>
          </li>
        </ul>
      </section>

      <RouterLink to="/apprendre" class="cl-button green cl-guide-done">Retour au chemin</RouterLink>
    </div>
  </AppShell>
</template>

<style scoped>
.cl-guide-kicker {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--unit) !important;
}

.cl-app .cl-guide > header h1 {
  margin: 4px 0 8px;
}

.cl-guide-duo {
  width: auto;
}

.cl-app .cl-guide h3 {
  color: var(--unit);
}

.cl-guide-phrases {
  align-items: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cl-guide-phrase {
  align-items: flex-start;
  gap: 16px;
}

.cl-guide-phrase strong {
  font-size: 18px;
}

.cl-guide-phrase p {
  color: var(--muted);
}

.cl-guide-number {
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

.cl-guide-sources {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cl-guide-sources a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  font-weight: 700;
  color: var(--toque-bright);
  background: #fff;
  border: 2px solid var(--toque-line);
  border-radius: 12px;
}

.cl-guide-sources a:hover {
  background: var(--wash);
}

.cl-guide-sources svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.cl-app .cl-guide-tips h2 {
  margin-bottom: 20px;
}

.cl-guide-done {
  width: 100%;
  margin: 32px 0 24px;
}

.cl-guide-missing {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding-top: 64px;
  text-align: center;
}

.cl-guide-missing p {
  color: var(--muted);
}
</style>
