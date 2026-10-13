<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({ artifact: { type: Object, required: true } })

const paragraphs = computed(() => [].concat(props.artifact.body || []))
const initial = computed(() => stripZones(props.artifact.fromName).trim().charAt(0).toUpperCase() || '?')
</script>

<template>
  <div class="mail">
    <p class="mail-subject"><Z :t="artifact.subject" /></p>
    <div class="mail-head">
      <span class="mail-avatar" aria-hidden="true">{{ initial }}</span>
      <p class="mail-from">
        <strong><Z :t="artifact.fromName" /></strong>
        <span class="mail-address">&lt;<Z :t="artifact.fromAddress" />&gt;</span>
        <span class="mail-to">à moi</span>
      </p>
      <span class="mail-time">{{ artifact.time }}</span>
    </div>
    <div class="mail-body">
      <p v-if="artifact.greeting"><Z :t="artifact.greeting" /></p>
      <p v-for="(paragraph, index) in paragraphs" :key="index"><Z :t="paragraph" /></p>
      <p v-if="artifact.button" class="mail-button"><Z :t="artifact.button" /></p>
      <p v-if="artifact.attachment" class="mail-attachment">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 6.5 8.4 14.6a2 2 0 0 0 2.8 2.8l8.1-8.1a4 4 0 0 0-5.6-5.6L5.4 12a6 6 0 0 0 8.5 8.5l6.6-6.6" /></svg>
        <span class="visually-hidden">Pièce jointe :</span>
        <Z :t="artifact.attachment" />
      </p>
      <p v-if="artifact.footer" class="mail-footer"><Z :t="artifact.footer" /></p>
    </div>
  </div>
</template>

<style scoped>
.mail {
  max-width: 560px;
  background: #fff;
  border: 2px solid var(--ink);
}

.mail-subject {
  padding: 12px 16px 4px;
  font-size: 1.12rem;
  font-weight: 650;
  line-height: 1.3;
}

.mail-head {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: start;
  gap: 10px;
  padding: 8px 16px 10px;
  border-bottom: 1px solid #e3e3e6;
}

.mail-avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #5a6b8c;
  color: #fff;
  font-weight: 600;
}

.mail-from {
  display: grid;
  font-size: 0.9rem;
  line-height: 1.35;
  min-width: 0;
}

.mail-address,
.mail-to,
.mail-time {
  color: #5f6368;
  font-size: 0.85rem;
}

.mail-body {
  display: grid;
  gap: 10px;
  padding: 14px 16px 16px;
}

.mail-button {
  justify-self: start;
  padding: 9px 16px;
  background: #2f5fd0;
  color: #fff;
  font-weight: 600;
  border-radius: 4px;
}

.mail-attachment {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid #c9ccd3;
  border-radius: 6px;
  background: #f6f7f9;
  font-size: 0.88rem;
}

.mail-attachment svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #5f6368;
  stroke-width: 2;
  stroke-linecap: round;
}

.mail-footer {
  padding-top: 8px;
  border-top: 1px solid #eee;
  font-size: 0.8rem;
  color: #6b6b70;
}
</style>
