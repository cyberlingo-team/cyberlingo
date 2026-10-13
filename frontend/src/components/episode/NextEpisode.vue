<script setup>
// « À suivre » : la dernière case de la planche. Demain, Léopold aura un autre déguisement ;
// on n'en voit que la silhouette. De quoi revenir.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Picture from '../comic/Picture.vue'
import { gangImage, villainImage } from '../../lib/images.js'
import { typo, untilMidnight } from '../../lib/format.js'

defineProps({
  next: { type: Object, required: true },
})

const countdown = ref(untilMidnight())
let timer = null

onMounted(() => {
  timer = setInterval(() => (countdown.value = untilMidnight()), 30000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="next panel" aria-labelledby="next-title">
    <p class="next-corner" aria-hidden="true">À suivre…</p>
    <div class="next-art" :class="{ 'next-art--villain': next.villain }">
      <Picture
        v-if="next.villain"
        class="next-silhouette"
        :image="villainImage(next.villain.id)"
        alt="La silhouette de Léopold dans son déguisement de demain."
      />
      <Picture v-else class="next-guest" :image="gangImage(next.guest.id)" :alt="next.guest.look || next.guest.name" />
      <span v-if="next.villain" class="next-mark" aria-hidden="true">?</span>
    </div>
    <div class="next-text">
      <h2 id="next-title" class="next-title">Demain, épisode {{ next.number }}</h2>
      <p class="caption next-hook">{{ typo(next.hook) }}</p>
      <p v-if="next.villain">Léopold essaie déjà un nouveau déguisement. Sauras-tu le reconnaître à temps ?</p>
      <p v-else>Pas d’escroc prévu demain : juste un réflexe de plus pour ton Tux.</p>
      <p class="next-when">Parution à minuit, dans {{ countdown }}.</p>
    </div>
  </section>
</template>

<style scoped>
.next {
  display: grid;
  grid-template-columns: minmax(110px, 0.6fr) 1.4fr;
  align-items: center;
  gap: clamp(14px, 3vw, 28px);
  padding: clamp(16px, 3.4vw, 26px);
  padding-top: clamp(30px, 5vw, 40px);
  overflow: hidden;
}

.next-corner {
  position: absolute;
  right: -3px;
  top: -3px;
  padding: 4px 12px 4px 14px;
  background: var(--ink);
  color: var(--caption);
  font-family: var(--font-hand);
  font-weight: 700;
  font-style: italic;
}

.next-art {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 180px;
}

.next-art--villain {
  background-image: radial-gradient(#cfe4ef 2.6px, transparent 3px);
  background-size: 10px 10px;
}

.next-silhouette {
  width: auto;
  max-height: 230px;
  filter: brightness(0);
  opacity: 0.88;
}

.next-guest {
  width: auto;
  max-height: 180px;
}

.next-mark {
  position: absolute;
  right: 4%;
  top: 2%;
  font-family: var(--font-title);
  font-size: 4rem;
  font-weight: 900;
  font-stretch: 130%;
  line-height: 1;
  color: var(--caption);
  -webkit-text-stroke: 2px var(--ink);
  paint-order: stroke fill;
  transform: rotate(12deg);
}

.next-text {
  display: grid;
  gap: 10px;
  justify-items: start;
}

.next-title {
  font-size: clamp(1.6rem, 5.4vw, 2.3rem);
  font-weight: 900;
  font-stretch: 112%;
}

.next-hook {
  font-size: 1.08rem;
}

.next-when {
  font-weight: 700;
}

@media (max-width: 520px) {
  .next {
    grid-template-columns: 92px 1fr;
    align-items: start;
  }

  .next-art {
    min-height: 0;
  }

  .next-silhouette {
    max-height: 170px;
  }

  .next-mark {
    font-size: 2.8rem;
  }
}
</style>
