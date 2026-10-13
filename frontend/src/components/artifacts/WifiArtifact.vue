<script setup>
import Z from './ZoneText.vue'

defineProps({ artifact: { type: Object, required: true } })
</script>

<template>
  <div class="wifi">
    <p class="wifi-head">
      Réseaux Wi-Fi disponibles
      <span v-if="artifact.place" class="wifi-place"><Z :t="artifact.place" /></span>
    </p>
    <ul class="wifi-list">
      <li v-for="(network, index) in artifact.networks" :key="index" class="wifi-network">
        <svg class="wifi-signal" viewBox="0 0 24 20" :aria-label="`Signal ${['faible', 'moyen', 'fort'][network.signal - 1]}`" role="img">
          <path :class="{ on: network.signal >= 1 }" d="M9.2 16.2a4 4 0 0 1 5.6 0L12 19z" />
          <path :class="{ on: network.signal >= 2 }" d="M5.6 12.6a9 9 0 0 1 12.8 0l-2 2a6.2 6.2 0 0 0-8.8 0z" />
          <path :class="{ on: network.signal >= 3 }" d="M2 9a14 14 0 0 1 20 0l-2 2a11.2 11.2 0 0 0-16 0z" />
        </svg>
        <span class="wifi-name"><Z :t="network.name" /></span>
        <span class="wifi-lock">
          <svg v-if="network.locked" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
          <span class="wifi-lock-text">{{ network.locked ? 'Protégé par mot de passe' : 'Ouvert' }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wifi {
  max-width: 440px;
  background: #fff;
  border: 2px solid var(--ink);
  border-radius: 14px;
  overflow: hidden;
}

.wifi-head {
  display: grid;
  padding: 12px 16px 10px;
  font-weight: 650;
  background: #f4f4f6;
  border-bottom: 1px solid #ddd;
}

.wifi-place {
  font-weight: 400;
  font-size: 0.85rem;
  color: #6b6b70;
}

.wifi-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.wifi-network {
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
}

.wifi-network + .wifi-network {
  border-top: 1px solid #eee;
}

.wifi-signal {
  width: 24px;
  height: 20px;
}

.wifi-signal path {
  fill: #d4d6db;
}

.wifi-signal path.on {
  fill: #2a2d33;
}

.wifi-name {
  font-weight: 500;
}

.wifi-lock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #6b6b70;
}

.wifi-lock svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #2a2d33;
  stroke-width: 2.2;
}

@media (max-width: 420px) {
  .wifi-lock-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
}
</style>
