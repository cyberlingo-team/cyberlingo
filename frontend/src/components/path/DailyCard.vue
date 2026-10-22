<script setup>
// La mission du jour, en tête du chemin : la même pour tout le monde, elle fait avancer la série
// et rapporte le plus de points.
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
  <section class="daily" :class="`daily--${daily.status}`" aria-labelledby="daily-title">
    <div class="daily-text">
      <p class="kicker daily-kicker">Mission du jour · n° {{ daily.number }}</p>
      <h2 id="daily-title" class="daily-title">{{ typo(daily.title) }}</h2>
      <p class="daily-hook">{{ typo(daily.hook) }}</p>
      <p class="daily-meta">
        <template v-if="daily.status === 'done'">
          <Icon name="haltere" :size="26" />
          <span>Faite : <strong>+{{ plural(daily.points ?? 0, 'point') }}</strong>. La prochaine arrive dans {{ untilMidnight() }}.</span>
        </template>
        <template v-else>
          <Icon name="flamme" :size="20" />
          <span>Jusqu’à <strong>{{ plural(daily.maxPoints, 'point') }}</strong> · encore {{ untilMidnight() }}</span>
        </template>
      </p>
      <RouterLink class="button daily-cta" :class="{ 'button--ghost': daily.status === 'done' }" to="/mission-du-jour">{{ cta }}</RouterLink>
      <p v-if="daily.players" class="daily-players">{{ plural(daily.players, 'joueur') }} l’ont déjà faite aujourd’hui.</p>
    </div>
    <div class="daily-art" aria-hidden="true">
      <img :src="mascot.src" alt="" class="daily-mascot" />
      <img :src="guest.src" alt="" class="daily-guest" />
    </div>
  </section>
</template>

<style scoped>
.daily {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 12px;
  padding: 22px 22px 22px 26px;
  overflow: hidden;
  color: #fff;
  background: var(--toque);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--toque-deep);
}

.daily::before {
  content: '';
  position: absolute;
  right: -60px;
  top: -40px;
  width: 300px;
  height: 300px;
  background: var(--toque-bright);
  border-radius: 50%;
  opacity: 0.55;
}

.daily-text {
  position: relative;
  display: grid;
  justify-items: start;
  gap: 8px;
}

.daily-kicker {
  color: #ffc58a;
}

.daily-title {
  font-size: 1.6rem;
}

.daily-hook {
  max-width: 40ch;
  color: #dfe3ff;
}

.daily-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #dfe3ff;
}

.daily-meta strong {
  color: #fff;
}

.daily-cta {
  margin-top: 6px;
}

.daily--done .daily-cta {
  --text: var(--toque);
}

.daily-players {
  font-size: 0.85rem;
  color: #b9c1f2;
}

.daily-art {
  position: relative;
  align-self: end;
  height: 190px;
}

.daily-mascot {
  position: absolute;
  right: 0;
  bottom: -22px;
  height: 200px;
  width: auto;
}

.daily-guest {
  position: absolute;
  left: -6px;
  bottom: -10px;
  height: 84px;
  width: auto;
}

@media (max-width: 520px) {
  .daily {
    grid-template-columns: minmax(0, 1fr) 96px;
    padding: 18px;
  }

  .daily-title {
    font-size: 1.35rem;
  }

  .daily-art {
    height: 120px;
  }

  .daily-mascot {
    height: 130px;
    right: -14px;
  }

  .daily-guest {
    display: none;
  }
}
</style>
