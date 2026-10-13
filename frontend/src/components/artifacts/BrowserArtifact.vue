<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({ artifact: { type: Object, required: true } })

const lines = computed(() => [].concat(props.artifact.body || []))
const fields = computed(() => [].concat(props.artifact.fields || []))
const insecure = computed(() => stripZones(props.artifact.url).startsWith('http://'))
</script>

<template>
  <div class="browser">
    <div class="browser-bar">
      <span class="browser-address">
        <svg v-if="!insecure" class="browser-lock" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
        <span v-else class="browser-insecure">Non sécurisé</span>
        <span class="visually-hidden">Adresse :</span>
        <span class="browser-url"><Z :t="artifact.url" /></span>
      </span>
    </div>
    <div class="browser-page">
      <p class="browser-title"><Z :t="artifact.title" /></p>
      <p v-for="(line, index) in lines" :key="`l${index}`"><Z :t="line" /></p>
      <div v-for="(field, index) in fields" :key="`f${index}`" class="browser-field">
        <span class="browser-label"><Z :t="field" /></span>
        <span class="browser-input" aria-hidden="true"></span>
      </div>
      <p v-if="artifact.cta" class="browser-cta"><Z :t="artifact.cta" /></p>
    </div>
  </div>
</template>

<style scoped>
.browser {
  max-width: 560px;
  background: #fff;
  border: 2px solid var(--ink);
  border-radius: 10px;
  overflow: hidden;
}

.browser-bar {
  padding: 8px 10px;
  background: #e8eaee;
  border-bottom: 1px solid #cfd2d8;
}

.browser-address {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  background: #fff;
  border-radius: 999px;
  font-size: 0.88rem;
  min-width: 0;
}

.browser-lock {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #3c4043;
  stroke-width: 2.2;
}

.browser-insecure {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: #b3261e;
  font-weight: 600;
}

.browser-url {
  min-width: 0;
}

.browser-page {
  display: grid;
  gap: 10px;
  padding: 16px 18px 18px;
}

.browser-title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
}

.browser-field {
  display: grid;
  gap: 4px;
  font-size: 0.85rem;
  color: #3c4043;
}

.browser-input {
  height: 34px;
  border: 1px solid #b9bdc5;
  border-radius: 5px;
}

.browser-cta {
  justify-self: start;
  padding: 9px 18px;
  background: #33415c;
  color: #fff;
  font-weight: 600;
  border-radius: 5px;
}
</style>
