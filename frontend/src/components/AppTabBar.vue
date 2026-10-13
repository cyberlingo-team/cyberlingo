<script setup>
// La barre d'onglets du téléphone, toujours à portée de pouce.
import { useRoute } from 'vue-router'
import { NAV_ITEMS, isActive } from '../lib/navigation.js'

const route = useRoute()
</script>

<template>
  <nav class="tabbar" aria-label="Navigation principale">
    <RouterLink
      v-for="item in NAV_ITEMS"
      :key="item.to"
      :to="item.to"
      class="tab"
      :class="{ 'is-active': isActive(item, route) }"
      :aria-current="isActive(item, route) ? 'page' : undefined"
    >
      <svg class="tab-icon" viewBox="0 0 28 28" aria-hidden="true">
        <!-- Aujourd'hui : le strip du jour, trois cases. -->
        <g v-if="item.icon === 'today'">
          <rect x="2.5" y="7" width="23" height="14" />
          <path d="M10 7v14M17.5 7v14" />
          <path class="fill" d="M4.5 9h4v3.5h-4z" />
        </g>
        <!-- Épisodes : la pile des numéros parus. -->
        <g v-else-if="item.icon === 'episodes'">
          <path d="M8 4.5h14.5v18" />
          <rect x="4.5" y="8" width="14" height="17" />
          <path d="M7.5 12h8M7.5 15.5h8M7.5 19h5" />
        </g>
        <!-- Classement : trois marches. -->
        <g v-else-if="item.icon === 'leaderboard'">
          <path d="M2.5 24.5h23" />
          <rect x="10" y="7" width="8" height="17.5" />
          <rect x="3" y="13" width="7" height="11.5" />
          <rect x="18" y="16" width="7" height="8.5" />
        </g>
        <!-- Mon Tux : sa tête et sa toque. -->
        <g v-else>
          <path d="M6 24c0-8 3.5-14 8-14s8 6 8 14z" />
          <path class="fill" d="M4 8.5l10-4.5 10 4.5-10 3.8z" />
          <path d="M11.4 16.5l2.6 2 2.6-2" />
        </g>
      </svg>
      <span class="tab-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-height: var(--tabbar-height);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--paper);
  border-top: var(--line) solid var(--ink);
}

.tab {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  padding: 6px 2px;
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: 600;
}

.tab + .tab {
  border-left: 2px solid var(--ink);
}

.tab-icon {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: var(--ink);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.tab-icon .fill {
  fill: var(--ink);
}

.tab.is-active {
  background: var(--caption);
  font-weight: 850;
}

@media (min-width: 860px) {
  .tabbar {
    display: none;
  }
}
</style>
