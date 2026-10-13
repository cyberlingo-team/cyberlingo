<script setup>
// Un pseudo écrit avec les muscles de son Tux (voir lib/muscle.js). Les longs pseudos se coupent
// de préférence après un point, un tiret ou un tiret bas.
import { computed } from 'vue'
import { muscle } from '../../lib/muscle.js'

const props = defineProps({
  name: { type: String, required: true },
  level: { type: Number, default: 0 },
  as: { type: String, default: 'span' },
})

const style = computed(() => muscle(props.level))
const parts = computed(() => props.name.split(/(?<=[._-])/))
</script>

<template>
  <component :is="as" class="muscle-name" :style="style"
    ><template v-for="(part, index) in parts" :key="index"
      >{{ part }}<wbr v-if="index < parts.length - 1" /></template
  ></component>
</template>

<style scoped>
.muscle-name {
  font-family: var(--font-title);
  line-height: 1.05;
  overflow-wrap: anywhere;
}
</style>
