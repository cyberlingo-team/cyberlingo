<script setup>
// Un autocollant avec un QR code. Le motif est dessiné au hasard (mais toujours le même pour un
// même autocollant) : il ressemble à un QR code sans en être un, on ne peut pas le scanner.
import { computed } from 'vue'
import Z from './ZoneText.vue'
import { stripZones } from '../../lib/zones.js'

const props = defineProps({ artifact: { type: Object, required: true } })

const SIZE = 25

function seeded(text) {
  let h = 2166136261
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const modules = computed(() => {
  const random = seeded(stripZones(props.artifact.label))
  const cells = []
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > SIZE - 9 && y < 8) || (x < 8 && y > SIZE - 9)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inFinder(x, y)) continue
      if (y === 6 || x === 6) {
        if ((x + y) % 2 === 0) cells.push([x, y])
      } else if (random() < 0.48) cells.push([x, y])
    }
  }
  return cells
})

const finders = [
  [0, 0],
  [SIZE - 7, 0],
  [0, SIZE - 7],
]
</script>

<template>
  <div class="qr">
    <p class="qr-place"><Z :t="artifact.place" /></p>
    <div class="qr-sticker">
      <svg class="qr-code" :viewBox="`-2 -2 ${SIZE + 4} ${SIZE + 4}`" role="img" aria-label="QR code">
        <rect x="-2" y="-2" :width="SIZE + 4" :height="SIZE + 4" fill="#fff" />
        <g v-for="([fx, fy], index) in finders" :key="index">
          <rect :x="fx" :y="fy" width="7" height="7" fill="#111" />
          <rect :x="fx + 1" :y="fy + 1" width="5" height="5" fill="#fff" />
          <rect :x="fx + 2" :y="fy + 2" width="3" height="3" fill="#111" />
        </g>
        <rect v-for="([x, y], index) in modules" :key="`m${index}`" :x="x" :y="y" width="1.02" height="1.02" fill="#111" />
      </svg>
      <p class="qr-label"><Z :t="artifact.label" /></p>
      <p v-if="artifact.caption" class="qr-caption"><Z :t="artifact.caption" /></p>
    </div>
    <p v-if="artifact.url" class="qr-scan">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4" /></svg>
      <span>Le téléphone propose d’ouvrir : <strong class="qr-url"><Z :t="artifact.url" /></strong></span>
    </p>
  </div>
</template>

<style scoped>
.qr {
  max-width: 400px;
  display: grid;
  gap: 10px;
}

.qr-place {
  font-size: 0.85rem;
  color: #4a4f57;
  font-style: italic;
}

.qr-sticker {
  justify-self: start;
  display: grid;
  justify-items: center;
  gap: 8px;
  width: min(250px, 100%);
  padding: 14px 14px 12px;
  background: #fff;
  border: 2px solid var(--ink);
  border-radius: 10px;
  transform: rotate(1.6deg);
  box-shadow: inset 0 0 0 5px #f2b705;
}

.qr-code {
  width: 150px;
  height: 150px;
}

.qr-label {
  font-weight: 800;
  text-align: center;
  line-height: 1.25;
}

.qr-caption {
  font-size: 0.82rem;
  text-align: center;
  color: #4a4f57;
}

.qr-scan {
  --zone-line: #ffd84a;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  background: #24262b;
  color: #fff;
  border-radius: 12px;
  font-size: 0.88rem;
}

.qr-scan svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: #fff;
  stroke-width: 2;
}

.qr-url {
  font-weight: 600;
}
</style>
