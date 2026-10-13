<script setup>
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({ artifact: { type: Object, required: true } })

const initial = computed(() => stripZones(props.artifact.author).trim().charAt(0).toUpperCase() || '?')
const paragraphs = computed(() => [].concat(props.artifact.text || []))
</script>

<template>
  <div class="post">
    <div class="post-head">
      <span class="post-avatar" aria-hidden="true">{{ initial }}</span>
      <span class="post-who">
        <span class="post-author"><Z :t="artifact.author" /></span>
        <span class="post-meta">
          <span v-if="artifact.handle"><Z :t="artifact.handle" /></span>
          <span v-if="artifact.time"><Z :t="artifact.time" /></span>
        </span>
      </span>
    </div>
    <p v-for="(paragraph, index) in paragraphs" :key="index" class="post-text"><Z :t="paragraph" /></p>
    <p v-if="artifact.reactions" class="post-reactions"><Z :t="artifact.reactions" /></p>
  </div>
</template>

<style scoped>
.post {
  max-width: 520px;
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border: 2px solid var(--ink);
  border-radius: 12px;
}

.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #c4572f;
  color: #fff;
  font-weight: 700;
}

.post-who {
  display: grid;
  line-height: 1.25;
  min-width: 0;
}

.post-author {
  font-weight: 700;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0 10px;
  font-size: 0.82rem;
  color: #65676b;
}

.post-reactions {
  padding-top: 8px;
  border-top: 1px solid #e4e6eb;
  font-size: 0.85rem;
  color: #65676b;
}
</style>
