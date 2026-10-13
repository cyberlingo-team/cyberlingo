<script setup>
// L'objet que le joueur examine dans une case : SMS, mail, page web, appel… collé dans la BD
// comme une coupure de journal. Il fournit aux textes (ZoneText) l'état de leurs zones.
import { computed, provide, toRef } from 'vue'
import SmsArtifact from './SmsArtifact.vue'
import EmailArtifact from './EmailArtifact.vue'
import BrowserArtifact from './BrowserArtifact.vue'
import CallArtifact from './CallArtifact.vue'
import ChatArtifact from './ChatArtifact.vue'
import PopupArtifact from './PopupArtifact.vue'
import PostArtifact from './PostArtifact.vue'
import WifiArtifact from './WifiArtifact.vue'
import NoteArtifact from './NoteArtifact.vue'
import AppArtifact from './AppArtifact.vue'
import QrArtifact from './QrArtifact.vue'

const KINDS = {
  sms: SmsArtifact,
  email: EmailArtifact,
  browser: BrowserArtifact,
  call: CallArtifact,
  chat: ChatArtifact,
  popup: PopupArtifact,
  post: PostArtifact,
  wifi: WifiArtifact,
  note: NoteArtifact,
  app: AppArtifact,
  qr: QrArtifact,
}

const LABELS = {
  sms: 'SMS reçu',
  email: 'Mail reçu',
  browser: 'Page web',
  call: 'Appel téléphonique',
  chat: 'Conversation',
  popup: 'Fenêtre d’alerte',
  post: 'Publication',
  wifi: 'Réseaux Wi-Fi',
  note: 'Note',
  app: 'Message d’application',
  qr: 'QR code',
}

const props = defineProps({
  artifact: { type: Object, required: true },
  mode: { type: String, default: 'read' },
  selected: { type: Array, default: () => [] },
  pick: { type: Number, default: 0 },
  noteNumbers: { type: Object, default: () => ({}) },
  // Pour la correction d'une question à indices : les bonnes zones et celles touchées.
  solution: { type: Array, default: null },
  picked: { type: Array, default: null },
  guestName: { type: String, default: '' },
})

const emit = defineEmits(['update:selected', 'full'])

provide('zones', {
  mode: toRef(props, 'mode'),
  isSelected: (zone) => props.selected.includes(zone),
  toggle(zone) {
    if (props.selected.includes(zone)) emit('update:selected', props.selected.filter((z) => z !== zone))
    else if (props.selected.length < props.pick) emit('update:selected', [...props.selected, zone])
    else emit('full')
  },
  noteNumber: (zone) => props.noteNumbers[zone] || null,
  classFor(zone) {
    const classes = []
    if (props.noteNumbers[zone]) classes.push('zone--noted')
    if (props.solution && props.picked) {
      const right = props.solution.includes(zone)
      const touched = props.picked.includes(zone)
      if (touched && right) classes.push('zone--found')
      else if (touched) classes.push('zone--wrong')
      else if (right) classes.push('zone--missed')
    }
    return classes
  },
})

const component = computed(() => KINDS[props.artifact.kind])
const label = computed(() => LABELS[props.artifact.kind] || 'Document')
</script>

<template>
  <figure class="artifact" :class="[`artifact--${artifact.kind}`, `artifact--${mode}`]" :aria-label="label">
    <component :is="component" v-if="component" :artifact="artifact" :guest-name="guestName" />
    <slot />
  </figure>
</template>

<style>
.artifact {
  position: relative;
  margin: 0;
  font-family: var(--font-object);
  font-size: 0.95rem;
  line-height: 1.42;
  color: #1d1d1f;
  overflow-wrap: anywhere;
}

/* Les zones touchables, quand on cherche les indices. */
.artifact .zone--pick {
  display: inline;
  margin: 0;
  padding: 0 0.12em;
  font: inherit;
  color: inherit;
  text-align: inherit;
  background: rgba(27, 42, 143, 0.06);
  border: 0;
  border-bottom: 2px dashed var(--zone-line, var(--toque));
  border-radius: 0;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  cursor: pointer;
}

.artifact .zone--pick:hover {
  background: var(--toque-pale);
}

.artifact .zone--pick[aria-pressed='true'] {
  color: var(--ink);
  background: var(--caption);
  border-bottom: 2px solid var(--ink);
  box-shadow: 0 0 0 2px var(--ink);
}

/* La correction au stylo rouge. */
.artifact .zone--noted {
  position: relative;
  padding: 0.05em 0.25em;
  border-radius: 0.9em 0.7em 1em 0.6em;
  box-shadow: 0 0 0 2px var(--alert);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.artifact .zone--noted::after {
  content: attr(data-note);
  position: absolute;
  top: -0.95em;
  right: -0.8em;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 1.45em;
  height: 1.45em;
  font-family: var(--font-title);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  color: var(--paper);
  background: var(--alert);
  border-radius: 50%;
}

.artifact .zone--found {
  color: var(--ink);
  background: var(--toque-pale);
  box-shadow: 0 0 0 2px var(--toque);
}

.artifact .zone--found.zone--noted {
  box-shadow: 0 0 0 2px var(--toque);
}

.artifact .zone--found.zone--noted::after {
  background: var(--toque);
}

.artifact .zone--wrong {
  color: var(--ink);
  text-decoration: line-through;
  text-decoration-color: var(--alert);
  text-decoration-thickness: 2px;
  background: var(--alert-pale);
}

.artifact .zone--missed {
  color: var(--ink);
  box-shadow: 0 0 0 2px var(--alert);
  background: var(--caption-pale);
}
</style>
