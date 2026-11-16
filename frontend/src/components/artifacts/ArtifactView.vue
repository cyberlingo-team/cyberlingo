<script setup>
// L'objet que le joueur examine dans une case : SMS, mail, page web, appel… collé dans la BD
// comme une coupure de journal. Il fournit aux textes (ZoneText) l'état de leurs zones.
import { computed, provide, toRef } from 'vue'
import { zoneStatus, ZONE_STATUS_LABELS } from '../../lib/zones.js'
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
  // Les annotations du prof, par zone : { number, good }. « good » : un détail rassurant.
  marks: { type: Object, default: () => ({}) },
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
  noteNumber: (zone) => props.marks[zone]?.number || null,
  // La correction : le vert et le rouge disent si le joueur a vu juste (voir zoneStatus).
  classFor(zone) {
    const status = statusOf(zone)
    if (!status) return []
    return [`zone--${status}`, ...(props.marks[zone] ? ['zone--noted'] : [])]
  },
  // Ce que la correction montre d'une zone, dit en toutes lettres pour les lecteurs d'écran.
  describe(zone) {
    const parts = []
    const mark = props.marks[zone]
    if (mark) parts.push(`annotation ${mark.number}`)
    const label = ZONE_STATUS_LABELS[statusOf(zone)]
    if (label) parts.push(label.toLowerCase())
    return parts.join(', ')
  },
})

function statusOf(zone) {
  const mark = props.marks[zone]
  return zoneStatus(zone, { solution: props.solution, picked: props.picked, noted: Boolean(mark), reassuring: mark?.good })
}

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

/* La correction. Le vert et le rouge ne parlent que de la réponse du joueur ; les annotations
   du prof sur les autres questions sont en orange (ce qui trahit l'arnaque) ou en bleu (ce qui
   rassure). Voir zoneStatus dans lib/zones.js. */
.artifact .zone--hit,
.artifact .zone--miss,
.artifact .zone--other,
.artifact .zone--alert,
.artifact .zone--good {
  padding: 0 0.25em;
  border: 2px solid var(--pen);
  border-radius: 0.5em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

/* Un indice que le joueur a touché : surligné en vert. */
.artifact .zone--hit {
  --pen: var(--success);
  background: var(--success-pale);
}

/* Touché, mais ce n'était pas un indice : en rouge, barré. */
.artifact .zone--miss {
  --pen: var(--alert);
  background: var(--alert-pale);
  text-decoration: line-through;
  text-decoration-color: var(--alert);
  text-decoration-thickness: 2px;
}

/* Un indice qu'il n'a pas touché : entouré de pointillés verts, sans fond. */
.artifact .zone--other {
  --pen: var(--success);
  border-style: dashed;
}

/* Relevé par le prof sans être un indice : juste le numéro, en gris. */
.artifact .zone--aside {
  --pen: #8a90a6;
}

.artifact .zone--alert {
  --pen: var(--beak);
}

.artifact .zone--good {
  --pen: var(--toque-bright);
}

/* Le numéro de l'annotation, écrit devant le passage, comme dans la marge d'une copie. */
.artifact .zone--noted::before {
  content: attr(data-note);
  display: inline-grid;
  place-items: center;
  width: 1.35em;
  height: 1.35em;
  margin-right: 0.3em;
  vertical-align: 0.08em;
  font-family: var(--font-title);
  font-size: 0.74em;
  font-weight: 800;
  font-style: normal;
  line-height: 1;
  text-decoration: none;
  color: var(--paper);
  background: var(--pen);
  border-radius: 50%;
}
</style>
