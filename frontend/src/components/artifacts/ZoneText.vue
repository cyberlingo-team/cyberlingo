<script setup>
// Un texte d'artefact, découpé en zones (voir lib/zones.js). Selon le moment, une zone est :
//   - du texte ordinaire, tant qu'on ne cherche rien (mode « read ») ;
//   - un bouton, quand le joueur cherche les indices (mode « pick ») ;
//   - un passage entouré au stylo, numéroté, après la correction (mode « review »).
import { computed, inject } from 'vue'
import { parseZones } from '../../lib/zones.js'
import { typo } from '../../lib/format.js'

const props = defineProps({
  t: { type: [String, Number], default: '' },
})

const zones = inject('zones', null)

const parts = computed(() => parseZones(props.t).map((part) => ({ ...part, text: typo(part.text) })))
const mode = computed(() => zones?.mode.value || 'read')
</script>

<template>
  <template v-for="(part, index) in parts" :key="index">
    <template v-if="!part.zone || mode === 'read'">{{ part.text }}</template>
    <button
      v-else-if="mode === 'pick'"
      type="button"
      class="zone zone--pick"
      :aria-pressed="zones.isSelected(part.zone)"
      @click="zones.toggle(part.zone)"
    >{{ part.text }}</button>
    <span
      v-else
      class="zone"
      :class="zones.classFor(part.zone)"
      :data-zone="part.zone"
      :data-note="zones.noteNumber(part.zone) || undefined"
    >{{ part.text }}<span v-if="zones.describe(part.zone)" class="visually-hidden"> ({{ zones.describe(part.zone) }})</span></span>
  </template>
</template>
