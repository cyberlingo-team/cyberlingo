<script setup>
// Le bilan d'une leçon ou de la mission du jour : ce qu'elle a rapporté, le Tux qui prend du
// muscle, ce qu'il faut retenir et les sources. Pour la mission du jour, on démasque Léopold
// et on montre la place au classement de la semaine.
import { computed, onMounted, ref } from 'vue'
import Icon from '../app/Icon.vue'
import { session } from '../../lib/session.js'
import { sceneImage, stageImage, villainImage } from '../../lib/images.js'
import { formatNumber, plural, typo } from '../../lib/format.js'
import { playSound } from '../../lib/sound.js'

const props = defineProps({
  // Le bilan, mis en forme par LessonView (voir normalize).
  result: { type: Object, required: true },
})

const emit = defineEmits(['continue'])

const r = computed(() => props.result)
const perfect = computed(() => r.value.correct === r.value.total)
const accuracy = computed(() => Math.round((r.value.correct / r.value.total) * 100))

const title = computed(() => {
  if (r.value.kind === 'daily') return perfect.value ? 'Mission du jour : sans faute !' : 'Mission du jour terminée !'
  if (r.value.kind === 'review') return perfect.value ? 'Bilan sans faute !' : 'Bilan terminé !'
  return perfect.value ? 'Sans faute !' : 'Leçon terminée !'
})

const before = computed(() => r.value.player?.before || null)
const after = computed(() => r.value.player?.after || null)
const grew = computed(() => before.value && after.value && after.value.stage.level > before.value.stage.level)
const tux = computed(() => stageImage(after.value?.stage.level ?? 0))

const tiles = computed(() => {
  const list = []
  if (r.value.points !== null && r.value.points !== undefined) list.push({ id: 'points', label: r.value.mode === 'guest' ? 'Points (avec un profil)' : 'Points', value: `+${formatNumber(r.value.points)}`, icon: 'haltere' })
  list.push({ id: 'accuracy', label: 'Précision', value: `${accuracy.value} %`, icon: 'cible' })
  if (r.value.kind === 'daily' && r.value.streak) list.push({ id: 'streak', label: 'Série', value: plural(r.value.streak, 'jour'), icon: 'flamme' })
  else if (r.value.sardines) list.push({ id: 'sardines', label: 'Sardines', value: `+${r.value.sardines}`, icon: 'sardine' })
  return list
})

// Léopold, déguisé, puis démasqué d'un clic.
const unmasked = ref(false)
function unmask() {
  unmasked.value = true
  playSound('unmask')
}

const rankText = computed(() => {
  const rank = r.value.rank
  if (!rank) return null
  const place = `${rank.position}${rank.position === 1 ? 're' : 'e'}`
  if (rank.previous && rank.previous > rank.position) return `Tu montes à la ${place} place du classement de la semaine (tu étais ${rank.previous}e).`
  return `Tu es à la ${place} place du classement de la semaine, sur ${rank.players} joueurs.`
})

onMounted(() => {
  playSound(grew.value ? 'grow' : 'correct')
})

const moralImage = sceneImage('prof-magnifier')
</script>

<template>
  <main id="contenu" class="result" tabindex="-1">
    <div class="result-hero">
      <img :src="tux.src" alt="" class="result-tux" :class="{ 'is-growing': grew }" />
      <h1 class="result-title">{{ title }}</h1>
      <p class="result-sub">{{ typo(r.title) }} · {{ r.correct }} bonne{{ r.correct > 1 ? 's' : '' }} réponse{{ r.correct > 1 ? 's' : '' }} sur {{ r.total }}</p>
      <p v-if="grew" class="result-grew">Ton Tux passe au stade <strong>{{ after.stage.name }}</strong> !</p>
      <p v-else-if="r.firstTime === false" class="result-replay">Leçon rejouée : elle ne rapporte pas de points cette fois.</p>
    </div>

    <ul class="tiles">
      <li v-for="tile in tiles" :key="tile.id" class="tile" :class="`tile--${tile.id}`">
        <p class="tile-label">{{ tile.label }}</p>
        <p class="tile-value"><Icon :name="tile.icon" :size="26" />{{ tile.value }}</p>
      </li>
    </ul>

    <section v-if="r.villain" class="card card--pad villain">
      <img :src="villainImage(unmasked ? 'unmasked' : r.villain.id).src" alt="" class="villain-image" />
      <div class="villain-text">
        <p class="kicker villain-kicker">Qui était derrière ?</p>
        <template v-if="unmasked">
          <p class="villain-title">C’était Léopold, {{ r.villain.disguise }} !</p>
          <p class="villain-quip">« {{ typo(r.villain.quip) }} »</p>
        </template>
        <template v-else>
          <p class="villain-title">Un drôle de personnage rôdait dans cette mission.</p>
          <button type="button" class="button button--blue button--small" @click="unmask">Le démasquer</button>
        </template>
      </div>
    </section>

    <p v-if="rankText" class="rank card card--pad"><Icon name="podium" :size="40" /><span>{{ rankText }}</span></p>

    <ul v-if="r.earned?.length" class="earned">
      <li v-for="quest in r.earned" :key="quest.id" class="earned-item">
        <Icon name="coffre-ouvert" :size="40" />
        <span>Quête réussie : <strong>{{ quest.title }}</strong> · +{{ plural(quest.reward, 'sardine') }}</span>
      </li>
    </ul>

    <section v-if="r.moral || r.reflexes?.length" class="card card--pad lesson-moral">
      <img :src="moralImage.src" alt="" class="moral-image" />
      <div class="moral-text">
        <h2 class="moral-title">À retenir</h2>
        <p v-if="r.moral">{{ typo(r.moral) }}</p>
        <ul v-else class="reflexes">
          <li v-for="item in r.reflexes" :key="item.title"><strong>{{ typo(item.title) }} :</strong> {{ typo(item.moral) }}</li>
        </ul>
      </div>
    </section>

    <section v-if="r.sources?.length" class="sources">
      <h2 class="kicker sources-title">Pour aller plus loin</h2>
      <ul>
        <li v-for="source in r.sources" :key="source.url"><a :href="source.url" target="_blank" rel="noopener">{{ typo(source.label) }}</a></li>
      </ul>
    </section>

    <section v-if="!session.user" class="card card--pad guest">
      <p class="guest-title">Garde tes progrès</p>
      <p class="muted">Crée un profil gratuit : tes points, ta série et ton Tux te suivent, et tu entres au classement.</p>
      <RouterLink to="/inscription" class="button button--blue">Créer un profil</RouterLink>
    </section>

    <div class="result-actions">
      <button type="button" class="button button--wide" @click="emit('continue')">Continuer</button>
    </div>
  </main>
</template>

<style scoped>
.result {
  display: grid;
  gap: 22px;
  width: min(600px, 100%);
  margin: 0 auto;
  padding: 32px var(--gutter) 48px;
}

.result-hero {
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
}

.result-tux {
  width: auto;
  height: 190px;
}

.result-tux.is-growing {
  animation: grow 0.9s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.result-title {
  font-size: clamp(1.7rem, 5vw, 2.2rem);
  color: var(--beak);
}

.result-sub {
  color: var(--muted);
}

.result-grew {
  padding: 8px 14px;
  font-weight: 700;
  color: var(--toque);
  background: var(--toque-pale);
  border-radius: var(--radius-small);
}

.result-replay {
  font-size: 0.95rem;
  color: var(--muted);
}

/* Les tuiles de score, à la manière d'un tableau de bord. */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 0;
  list-style: none;
}

.tile {
  --tone: var(--beak);
  overflow: hidden;
  text-align: center;
  background: var(--tone);
  border: 2px solid var(--tone);
  border-radius: var(--radius);
}

.tile--accuracy {
  --tone: var(--success);
}

.tile--streak {
  --tone: var(--alert);
}

.tile--sardines {
  --tone: var(--toque-bright);
}

.tile-label {
  padding: 4px 8px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
}

.tile-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 8px;
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--tone);
  background: var(--paper);
  border-radius: calc(var(--radius) - 2px);
}

/* Léopold. */
.villain {
  display: flex;
  align-items: center;
  gap: 18px;
}

.villain-image {
  flex-shrink: 0;
  width: auto;
  height: 150px;
}

.villain-text {
  display: grid;
  justify-items: start;
  gap: 8px;
}

.villain-kicker {
  color: var(--beak-ink);
}

.villain-title {
  font-size: 1.15rem;
  font-weight: 800;
}

.villain-quip {
  font-style: italic;
  color: var(--muted);
}

.rank {
  display: flex;
  align-items: center;
  gap: 14px;
  font-weight: 700;
}

.earned {
  display: grid;
  gap: 8px;
  padding: 0;
  list-style: none;
}

.earned-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--beak-pale);
  border-radius: var(--radius-small);
}

.lesson-moral {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.moral-image {
  flex-shrink: 0;
  width: 84px;
}

.moral-text {
  display: grid;
  gap: 8px;
}

.moral-title {
  font-size: 1.2rem;
  color: var(--toque);
}

.reflexes {
  display: grid;
  gap: 6px;
  padding-left: 1.1em;
}

.sources {
  display: grid;
  gap: 6px;
}

.sources-title {
  color: var(--muted);
}

.sources ul {
  display: grid;
  gap: 4px;
  padding-left: 1.1em;
}

.guest {
  display: grid;
  justify-items: start;
  gap: 8px;
  background: var(--toque-pale);
  border-color: var(--toque-line);
}

.guest-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--toque);
}

.result-actions {
  position: sticky;
  bottom: 0;
  margin-inline: calc(-1 * var(--gutter));
  padding: 16px var(--gutter);
  background: var(--paper);
  border-top: 2px solid var(--rule);
}

@keyframes grow {
  from {
    transform: scale(0.6);
  }
  to {
    transform: scale(1);
  }
}

@media (max-width: 520px) {
  .villain {
    flex-direction: column;
    text-align: center;
  }

  .villain-text {
    justify-items: center;
  }

  .moral-image {
    display: none;
  }
}
</style>
