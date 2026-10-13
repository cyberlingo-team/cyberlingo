<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'

const props = defineProps({ artifact: { type: Object, required: true } })

const lines = computed(() => [].concat(props.artifact.body || []))
const buttons = computed(() => [].concat(props.artifact.buttons || []))
</script>

<template>
  <div class="app">
    <p class="app-name">
      <span class="app-icon" aria-hidden="true"></span>
      <Z :t="artifact.app" />
    </p>
    <p class="app-title"><Z :t="artifact.title" /></p>
    <p v-for="(line, index) in lines" :key="index" class="app-line"><Z :t="line" /></p>
    <p v-if="buttons.length" class="app-buttons">
      <span v-for="(button, index) in buttons" :key="index" class="app-button"><Z :t="button" /></span>
    </p>
  </div>
</template>

<style scoped>
.app {
  max-width: 420px;
  display: grid;
  gap: 8px;
  padding: 16px 18px 14px;
  background: #fbfbfd;
  border: 2px solid var(--ink);
  border-radius: 20px;
}

.app-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #6b6b70;
}

.app-icon {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: #5a6b8c;
}

.app-title {
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.3;
}

.app-buttons {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  margin: 6px -18px -14px;
  border-top: 1px solid #dcdce1;
}

.app-button {
  padding: 11px 8px;
  text-align: center;
  color: #2f5fd0;
  font-weight: 600;
}

.app-button + .app-button {
  border-left: 1px solid #dcdce1;
}
</style>
