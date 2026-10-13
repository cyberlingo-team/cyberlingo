<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({
  artifact: { type: Object, required: true },
  guestName: { type: String, default: '' },
})

const callerName = computed(() => stripZones(props.artifact.caller))
</script>

<template>
  <div class="call">
    <div class="call-head">
      <span class="call-state">Appel en cours</span>
      <span class="call-caller"><Z :t="artifact.caller" /></span>
      <span v-if="artifact.number" class="call-number"><Z :t="artifact.number" /></span>
    </div>
    <ol class="call-lines">
      <li v-for="(line, index) in artifact.lines" :key="index" class="call-line" :class="`call-line--${line.who}`">
        <span class="call-who">{{ line.who === 'caller' ? callerName : guestName || 'Moi' }}</span>
        <span class="call-text"><Z :t="line.text" /></span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.call {
  max-width: 520px;
  border: 2px solid var(--ink);
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
}

.call-head {
  --zone-line: #ffd84a;
  display: grid;
  justify-items: center;
  gap: 1px;
  padding: 14px 16px 12px;
  background: #24262b;
  color: #fff;
  text-align: center;
}

.call-state {
  font-size: 0.78rem;
  color: #b9bcc4;
}

.call-caller {
  font-size: 1.15rem;
  font-weight: 600;
}

.call-number {
  font-size: 0.9rem;
  color: #d9dbe0;
  font-variant-numeric: tabular-nums;
}

.call-lines {
  list-style: none;
  margin: 0;
  padding: 12px 14px 14px;
  display: grid;
  gap: 9px;
}

.call-line {
  display: grid;
  gap: 1px;
}

.call-who {
  font-size: 0.75rem;
  font-weight: 700;
  color: #5f6368;
}

.call-line--guest {
  justify-items: end;
  text-align: right;
}

.call-text {
  max-width: 92%;
  padding: 7px 11px;
  border-radius: 12px;
  background: #f0f1f4;
}

.call-line--guest .call-text {
  background: #fff6d6;
}
</style>
