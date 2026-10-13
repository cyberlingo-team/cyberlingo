<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({ artifact: { type: Object, required: true } })

const initial = computed(() => {
  const first = stripZones(props.artifact.contact).trim().charAt(0)
  return /\p{L}/u.test(first) ? first.toUpperCase() : '?'
})
</script>

<template>
  <div class="chat">
    <div class="chat-top">
      <span class="chat-avatar" aria-hidden="true">{{ initial }}</span>
      <span class="chat-who">
        <span class="chat-contact"><Z :t="artifact.contact" /></span>
        <span v-if="artifact.number" class="chat-number"><Z :t="artifact.number" /></span>
      </span>
    </div>
    <ol class="chat-thread">
      <li v-for="(message, index) in artifact.messages" :key="index" class="chat-message" :class="`chat-message--${message.from}`">
        <span class="visually-hidden">{{ message.from === 'me' ? 'Réponse :' : 'Message reçu :' }}</span>
        <span class="chat-bubble"><Z :t="message.text" /></span>
        <span v-if="message.time" class="chat-time">{{ message.time }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.chat {
  max-width: 400px;
  border: 2px solid var(--ink);
  border-radius: 22px;
  overflow: hidden;
  background: #efeae2;
}

.chat-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid #ddd;
}

.chat-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #8a7f9e;
  color: #fff;
  font-weight: 600;
}

.chat-who {
  display: grid;
  line-height: 1.25;
  min-width: 0;
}

.chat-contact {
  font-weight: 600;
}

.chat-number {
  font-size: 0.8rem;
  color: #6b6b70;
}

.chat-thread {
  list-style: none;
  margin: 0;
  padding: 12px 12px 16px;
  display: grid;
  gap: 7px;
}

.chat-message {
  display: grid;
  justify-items: start;
}

.chat-message--me {
  justify-items: end;
}

.chat-bubble {
  max-width: 86%;
  padding: 7px 11px;
  background: #fff;
  border-radius: 12px 12px 12px 4px;
}

.chat-message--me .chat-bubble {
  background: #d9ecff;
  border-radius: 12px 12px 4px 12px;
}

.chat-time {
  font-size: 0.7rem;
  color: #6b6b70;
  padding: 1px 4px 0;
}
</style>
