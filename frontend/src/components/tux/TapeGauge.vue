<script setup>
// Le mètre ruban : où en est le Tux entre son stade et le suivant. La partie gagnée aujourd'hui
// se déroule à l'écran.
import { computed, onMounted, ref } from 'vue'
import { formatNumber } from '../../lib/format.js'
import { reducedMotion } from '../../lib/preferences.js'

const props = defineProps({
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  before: { type: Number, default: null },
  after: { type: Number, required: true },
  label: { type: String, default: '' },
})

const ratio = (value) => Math.max(0, Math.min(1, (value - props.from) / Math.max(1, props.to - props.from)))
const start = computed(() => (props.before === null ? ratio(props.after) : ratio(Math.max(props.before, props.from))))
const end = computed(() => ratio(props.after))
const shown = ref(reducedMotion() ? end.value : start.value)

onMounted(() => {
  if (shown.value !== end.value) setTimeout(() => (shown.value = end.value), 450)
})
</script>

<template>
  <div class="tape">
    <div
      class="tape-track"
      role="meter"
      :aria-valuemin="from"
      :aria-valuemax="to"
      :aria-valuenow="after"
      :aria-label="label"
    >
      <div class="tape-earned" :style="{ left: `${start * 100}%`, width: `${Math.max(0, shown - start) * 100}%` }"></div>
      <div class="tape-fill" :style="{ width: `${start * 100}%` }"></div>
    </div>
    <div class="tape-ends" aria-hidden="true">
      <span>{{ formatNumber(from) }}</span>
      <span>{{ formatNumber(to) }}</span>
    </div>
  </div>
</template>

<style scoped>
.tape {
  display: grid;
  gap: 3px;
}

.tape-track {
  position: relative;
  height: 30px;
  border: 2px solid var(--ink);
  background-color: var(--caption-pale);
  /* Graduations du mètre ruban. */
  background-image:
    repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 10%),
    repeating-linear-gradient(90deg, rgba(18, 10, 6, 0.5) 0 1px, transparent 1px 2%);
  background-size:
    100% 12px,
    100% 7px;
  background-repeat: no-repeat;
  background-position:
    0 100%,
    0 100%;
  overflow: hidden;
}

.tape-fill,
.tape-earned {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
}

.tape-fill {
  background: var(--toque);
}

.tape-earned {
  background: var(--beak);
  transition: width 1.1s cubic-bezier(0.25, 0.9, 0.3, 1);
}

.tape-ends {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
