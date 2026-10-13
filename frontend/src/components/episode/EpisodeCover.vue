<script setup>
// La couverture de l'épisode : son numéro, son titre, l'invité du jour et l'accroche.
import { computed } from 'vue'
import Picture from '../comic/Picture.vue'
import { gangImage } from '../../lib/images.js'
import { capitalize, episodeMinutes, formatDay, formatNumber, lowerFirst, typo } from '../../lib/format.js'

const props = defineProps({
  mission: { type: Object, required: true },
  stats: { type: Object, default: null },
  mode: { type: String, default: 'counted' },
  isToday: { type: Boolean, default: false },
  answered: { type: Number, default: 0 },
})

const emit = defineEmits(['start'])

const minutes = computed(() => episodeMinutes(props.mission.questions.length))

const readers = computed(() => {
  const stats = props.stats
  if (!stats || !stats.players) return null
  const who = stats.players > 1 ? `${formatNumber(stats.players)} joueurs l’ont déjà lu` : 'Un joueur l’a déjà lu'
  return stats.successRate === null ? `${who} aujourd’hui.` : `${who} aujourd’hui, avec ${stats.successRate} % de bonnes réponses.`
})

const startLabel = computed(() => (props.answered > 0 ? `Reprendre à la case ${props.answered + 1}` : 'Lire l’épisode'))
</script>

<template>
  <section class="cover panel" aria-labelledby="cover-title">
    <div class="cover-head">
      <p class="cover-issue">
        Épisode {{ mission.number }}<span class="cover-date">, {{ formatDay(mission.date) }}</span>
      </p>
      <p class="cover-theme">{{ mission.theme }}</p>
    </div>

    <h1 id="cover-title" class="cover-title">{{ typo(mission.title) }}</h1>

    <div class="cover-art">
      <div class="cover-burst" aria-hidden="true"></div>
      <Picture class="cover-guest" :image="gangImage(mission.guest.id)" :alt="mission.guest.look || mission.guest.name" eager />
      <p class="cover-hook caption">{{ typo(mission.hook) }}</p>
    </div>

    <div class="cover-foot">
      <p class="cover-cast"><strong>{{ capitalize(mission.guest.name) }}</strong>{{ typo(` : ${lowerFirst(mission.guest.tagline)}`) }}</p>
      <div class="cover-action">
        <button type="button" class="button cover-start" @click="emit('start')">{{ startLabel }}</button>
        <p class="cover-length">{{ mission.questions.length }} cases, environ {{ minutes }} minutes.</p>
      </div>
      <!-- En rattrapage, la page d'archive explique déjà que l'épisode ne rapporte plus de points. -->
      <p v-if="mode === 'guest' && isToday" class="cover-note">Pas besoin de compte pour jouer. Si tu en crées un à la fin, tes réponses comptent.</p>
      <p v-if="readers" class="cover-readers">{{ readers }}</p>
    </div>
  </section>
</template>

<style scoped>
.cover {
  display: grid;
  gap: 14px;
  padding: clamp(14px, 3.6vw, 28px);
  border-width: 4px;
  overflow: hidden;
}

.cover-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.cover-issue {
  font-family: var(--font-title);
  font-weight: 850;
  font-size: 1.1rem;
}

.cover-date {
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.cover-theme {
  padding: 2px 10px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.9rem;
  border: 2px solid var(--ink);
}

.cover-title {
  font-size: clamp(2.6rem, 11vw, 5.2rem);
  font-weight: 900;
  font-stretch: 118%;
  line-height: 0.92;
  letter-spacing: -0.015em;
  color: var(--caption);
  -webkit-text-stroke: 2px var(--ink);
  paint-order: stroke fill;
  text-shadow: 4px 4px 0 var(--ink);
}

.cover-art {
  position: relative;
  display: grid;
  grid-template-columns: minmax(120px, 0.9fr) 1.1fr;
  align-items: center;
  gap: 14px;
  min-height: 190px;
}

/* La trame de points jaune derrière l'invité, comme une explosion imprimée. */
.cover-burst {
  position: absolute;
  inset: -10% auto -10% -12%;
  width: 70%;
  background-image: radial-gradient(var(--caption) 3.4px, transparent 3.8px);
  background-size: 11px 11px;
  -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
  mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
}

.cover-guest {
  position: relative;
  justify-self: center;
  width: auto;
  max-width: 100%;
  max-height: 230px;
  object-fit: contain;
}

.cover-hook {
  position: relative;
  font-size: 1.12rem;
  transform: rotate(-1.2deg);
}

.cover-foot {
  display: grid;
  gap: 12px;
}

.cover-cast {
  max-width: 60ch;
}

.cover-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.cover-start {
  min-height: 56px;
  padding-inline: 1.6em;
  font-size: 1.25rem;
}

.cover-length,
.cover-readers {
  color: var(--muted);
}

.cover-note {
  padding-left: 10px;
  border-left: 4px solid var(--caption);
}

@media (max-width: 520px) {
  .cover-art {
    grid-template-columns: 1fr 1.25fr;
    min-height: 150px;
  }

  .cover-guest {
    max-height: 170px;
  }

  .cover-hook {
    font-size: 1rem;
  }

  .cover-start {
    width: 100%;
  }
}
</style>
