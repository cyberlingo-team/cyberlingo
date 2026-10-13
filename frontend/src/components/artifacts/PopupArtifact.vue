<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'

const props = defineProps({ artifact: { type: Object, required: true } })

const lines = computed(() => [].concat(props.artifact.body || []))
const buttons = computed(() => [].concat(props.artifact.buttons || []))
</script>

<template>
  <div class="popup">
    <div class="popup-bar">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 23 21.5H1z" /><path class="mark" d="M12 9v6M12 17.6v.4" /></svg>
      <span class="popup-title"><Z :t="artifact.title" /></span>
    </div>
    <div class="popup-body">
      <p v-for="(line, index) in lines" :key="index"><Z :t="line" /></p>
      <p v-if="artifact.phone" class="popup-phone"><Z :t="artifact.phone" /></p>
      <p v-if="buttons.length" class="popup-buttons">
        <span v-for="(button, index) in buttons" :key="index" class="popup-button"><Z :t="button" /></span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.popup {
  max-width: 500px;
  background: #fff;
  border: 2px solid var(--ink);
}

.popup-bar {
  --zone-line: #ffd84a;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #b3261e;
  color: #fff;
  font-weight: 700;
}

.popup-bar svg {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  fill: #ffd84a;
}

.popup-bar .mark {
  fill: none;
  stroke: #120a06;
  stroke-width: 2.4;
  stroke-linecap: round;
}

.popup-body {
  display: grid;
  gap: 9px;
  padding: 14px 16px 16px;
}

.popup-phone {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

.popup-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.popup-button {
  padding: 6px 16px;
  border: 1px solid #8d9199;
  border-radius: 4px;
  background: #f2f3f5;
  font-size: 0.9rem;
}
</style>
