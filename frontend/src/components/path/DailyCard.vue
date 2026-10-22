<script setup>
// La mission du jour, en tête du chemin : la même pour tout le monde, elle fait avancer la série
// et rapporte le plus de points. Une carte blanche à bord gris, comme les panneaux de l'appli.
import { computed } from 'vue'
import Icon from '../app/Icon.vue'
import { gangImage, sceneImage } from '../../lib/images.js'
import { plural, typo, untilMidnight } from '../../lib/format.js'

const props = defineProps({
  daily: { type: Object, required: true },
})

const guest = computed(() => gangImage(props.daily.guest.id))
const mascot = sceneImage('mission')
const cta = computed(() => {
  if (props.daily.status === 'done') return 'Revoir le bilan'
  if (props.daily.status === 'started') return `Reprendre (${props.daily.answered}/${props.daily.total})`
  return 'Jouer la mission'
})
</script>

<template>
  <section class="cl-daily" :class="`is-${daily.status}`" aria-labelledby="daily-title">
    <div class="cl-daily-text">
      <p class="cl-daily-kicker">
        <Icon name="flamme" :size="20" />
        Mission du jour · n° {{ daily.number }}
      </p>
      <h2 id="daily-title">{{ typo(daily.title) }}</h2>
      <p class="cl-daily-hook">{{ typo(daily.hook) }}</p>
      <p class="cl-daily-meta">
        <template v-if="daily.status === 'done'">Faite : <b>+{{ plural(daily.points ?? 0, 'point') }}</b>. La prochaine arrive dans {{ untilMidnight() }}.</template>
        <template v-else>Jusqu’à <b>{{ plural(daily.maxPoints, 'point') }}</b> · encore {{ untilMidnight() }}</template>
      </p>
      <RouterLink class="cl-button" :class="{ green: daily.status !== 'done' }" to="/mission-du-jour">{{ cta }}</RouterLink>
      <p v-if="daily.players" class="cl-daily-players">{{ plural(daily.players, 'joueur') }} l’ont déjà faite aujourd’hui.</p>
    </div>
    <div class="cl-daily-art" aria-hidden="true">
      <img :src="mascot.src" alt="" class="cl-daily-mascot" />
      <img :src="guest.src" alt="" class="cl-daily-guest" />
    </div>
  </section>
</template>

<style scoped>
.cl-daily {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px;
  gap: 16px;
  padding: 20px 20px 20px 24px;
  border: 2px solid var(--rule);
  border-radius: 16px;
}

.cl-daily-text {
  display: grid;
  justify-items: start;
  align-content: center;
  gap: 8px;
}

.cl-daily-kicker {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--beak-ink);
}

.cl-app .cl-daily h2 {
  font-size: 24px;
  line-height: 30px;
}

.cl-daily-hook,
.cl-daily-meta,
.cl-daily-players {
  color: var(--muted);
}

.cl-daily-meta b {
  color: var(--ink);
}

.cl-daily .cl-button {
  margin-top: 6px;
}

.cl-daily-players {
  font-size: 14px;
}

.cl-daily-art {
  position: relative;
  align-self: end;
  height: 180px;
}

.cl-daily-mascot {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 100%;
  width: auto;
}

.cl-daily-guest {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 42%;
  width: auto;
}

.cl-daily.is-done .cl-daily-art {
  opacity: 0.75;
}

@media (max-width: 699px) {
  .cl-daily {
    grid-template-columns: minmax(0, 1fr) 84px;
    gap: 8px;
    padding: 16px;
  }

  .cl-daily-kicker {
    font-size: 13px;
  }

  .cl-daily-hook {
    display: none;
  }

  .cl-daily .cl-button {
    padding: 0 18px;
  }

  .cl-app .cl-daily h2 {
    font-size: 20px;
    line-height: 26px;
  }

  .cl-daily-art {
    height: 110px;
  }

  .cl-daily-guest {
    display: none;
  }
}
</style>
