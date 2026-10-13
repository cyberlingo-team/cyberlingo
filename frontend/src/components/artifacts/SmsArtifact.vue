<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({ artifact: { type: Object, required: true } })

const initial = computed(() => {
  const first = stripZones(props.artifact.sender).trim().charAt(0)
  return /\p{L}/u.test(first) ? first.toUpperCase() : null
})
</script>

<template>
  <div class="sms">
    <div class="sms-top">
      <span class="sms-avatar" aria-hidden="true">
        <template v-if="initial">{{ initial }}</template>
        <svg v-else viewBox="0 0 24 24"><circle cx="12" cy="9" r="4.2" /><path d="M4 21c1-4.5 4.4-6.5 8-6.5s7 2 8 6.5z" /></svg>
      </span>
      <span class="sms-sender"><Z :t="artifact.sender" /></span>
      <span class="sms-kind">SMS</span>
    </div>
    <div class="sms-thread">
      <p class="sms-time">Aujourd’hui, {{ artifact.time }}</p>
      <p class="sms-bubble"><Z :t="artifact.body" /></p>
    </div>
  </div>
</template>

<style scoped>
.sms {
  max-width: 380px;
  background: #fff;
  border: 2px solid var(--ink);
  border-radius: 22px;
  overflow: hidden;
}

.sms-top {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 12px 14px 10px;
  background: #f4f4f6;
  border-bottom: 1px solid #ddd;
  text-align: center;
}

.sms-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #a8acb5;
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
}

.sms-avatar svg {
  width: 26px;
  height: 26px;
  fill: #fff;
}

.sms-sender {
  font-weight: 600;
  font-size: 0.98rem;
}

.sms-kind {
  font-size: 0.75rem;
  color: #6b6b70;
}

.sms-thread {
  display: grid;
  gap: 8px;
  padding: 12px 14px 18px;
}

.sms-time {
  justify-self: center;
  font-size: 0.75rem;
  color: #6b6b70;
}

.sms-bubble {
  justify-self: start;
  max-width: 88%;
  padding: 9px 13px;
  background: #e9e9eb;
  border-radius: 18px 18px 18px 5px;
}
</style>
