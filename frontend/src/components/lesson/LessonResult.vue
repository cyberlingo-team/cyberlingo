<script setup>
// Le bilan d'une leçon ou de la mission du jour, en écrans successifs comme dans la copie de
// référence : ce qu'elle a rapporté et le Tux qui prend du muscle, puis selon le cas Léopold à
// démasquer, la série, les quêtes remplies, ce qu'il faut retenir, et l'invitation à créer son
// profil. « Continuer » passe à l'écran suivant.
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

const steps = computed(() =>
  [
    'result',
    r.value.villain && 'villain',
    r.value.kind === 'daily' && r.value.streak && 'streak',
    r.value.earned?.length && 'quests',
    (r.value.moral || r.value.reflexes?.length) && 'moral',
    !session.user && 'profile',
  ].filter(Boolean),
)
const index = ref(0)
const step = computed(() => steps.value[index.value])

function next() {
  if (index.value + 1 < steps.value.length) index.value++
  else emit('continue')
}

const title = computed(() => {
  if (r.value.kind === 'daily') return perfect.value ? 'Mission du jour : sans faute !' : 'Mission du jour terminée !'
  if (r.value.kind === 'review') return perfect.value ? 'Bilan sans faute !' : 'Bilan terminé !'
  return perfect.value ? 'Sans faute !' : 'Leçon terminée !'
})

const before = computed(() => r.value.player?.before || null)
const after = computed(() => r.value.player?.after || null)
const grew = computed(() => before.value && after.value && after.value.stage.level > before.value.stage.level)
const tux = computed(() => stageImage(after.value?.stage.level ?? 0))

const stats = computed(() => {
  const list = []
  if (r.value.points !== null && r.value.points !== undefined) list.push({ id: 'points', label: r.value.mode === 'guest' ? 'Points (avec un profil)' : 'Points', value: `+${formatNumber(r.value.points)}`, icon: 'haltere' })
  list.push({ id: 'accuracy', label: perfect.value ? 'Sans faute' : 'Précision', value: `${accuracy.value} %`, icon: 'cible' })
  if (r.value.sardines) list.push({ id: 'sardines', label: 'Sardines', value: `+${r.value.sardines}`, icon: 'sardine' })
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

const moralImage = sceneImage('prof-magnifier').src
const guestImage = sceneImage('egg').src

onMounted(() => playSound(grew.value ? 'grow' : 'correct'))
</script>

<template>
  <main id="contenu" class="cl-results" :class="`cl-result-${step}`" tabindex="-1">
    <template v-if="step === 'result'">
      <img :src="tux.src" alt="" class="cl-result-tux" :class="{ growing: grew }" />
      <h1>{{ title }}</h1>
      <p>{{ typo(r.title) }} · {{ r.correct }} bonne{{ r.correct > 1 ? 's' : '' }} réponse{{ r.correct > 1 ? 's' : '' }} sur {{ r.total }}</p>
      <p v-if="grew" class="cl-result-grew">Ton Tux passe au stade <strong>{{ after.stage.name }}</strong> !</p>
      <p v-else-if="r.firstTime === false" class="cl-result-small">Leçon rejouée : elle ne rapporte pas de points cette fois.</p>
      <div class="cl-results-stats">
        <div v-for="stat in stats" :key="stat.id" :class="`cl-stat-${stat.id}`">
          <strong>{{ stat.label }}</strong>
          <span><Icon :name="stat.icon" :size="28" />{{ stat.value }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="step === 'villain'">
      <img :src="villainImage(unmasked ? 'unmasked' : r.villain.id).src" alt="" class="cl-result-villain" />
      <template v-if="unmasked">
        <h1>{{ typo(`C’était Léopold, ${r.villain.disguise} !`) }}</h1>
        <p>« {{ typo(r.villain.quip) }} »</p>
      </template>
      <template v-else>
        <h1>Qui était derrière ?</h1>
        <p>Un drôle de personnage rôdait dans cette mission.</p>
        <button type="button" class="cl-button blue" @click="unmask">Le démasquer</button>
      </template>
    </template>

    <template v-else-if="step === 'streak'">
      <Icon name="flamme" :size="140" />
      <h1>{{ plural(r.streak, 'jour') }} de série !</h1>
      <p v-if="rankText">{{ rankText }}</p>
      <p>Reviens demain pour la mission du jour : ta série continue.</p>
    </template>

    <template v-else-if="step === 'quests'">
      <h1>{{ r.earned.length > 1 ? 'Quêtes réussies !' : 'Quête réussie !' }}</h1>
      <ul class="cl-result-quests">
        <li v-for="quest in r.earned" :key="quest.id">
          <Icon name="coffre-ouvert" :size="56" />
          <span><strong>{{ quest.title }}</strong> +{{ plural(quest.reward, 'sardine') }}</span>
        </li>
      </ul>
    </template>

    <template v-else-if="step === 'moral'">
      <img :src="moralImage" alt="" class="cl-result-prof" />
      <h1>À retenir</h1>
      <p v-if="r.moral" class="cl-result-moral">{{ typo(r.moral) }}</p>
      <ul v-else class="cl-result-reflexes">
        <li v-for="item in r.reflexes" :key="item.title"><strong>{{ typo(item.title) }} :</strong> {{ typo(item.moral) }}</li>
      </ul>
      <section v-if="r.sources?.length" class="cl-result-sources">
        <h2>Pour aller plus loin</h2>
        <a v-for="source in r.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener">{{ typo(source.label) }}</a>
      </section>
    </template>

    <template v-else-if="step === 'profile'">
      <img :src="guestImage" alt="" class="cl-result-prof" />
      <h1>C’est le moment de créer ton profil !</h1>
      <p>C’est gratuit : tes points, ta série et ton Tux te suivent, et tu entres au classement.</p>
      <RouterLink class="cl-button green" to="/inscription">Créer un profil</RouterLink>
      <button type="button" class="cl-button cl-later" @click="next">Plus tard</button>
    </template>
  </main>

  <footer v-if="step !== 'profile'" class="cl-action-footer">
    <div>
      <button type="button" class="cl-button green" :disabled="step === 'villain' && !unmasked" @click="next">Continuer</button>
    </div>
  </footer>
</template>

<style scoped>
.cl-results {
  gap: 4px;
  padding-block: 32px 180px;
}

.cl-results:focus {
  outline: none;
}

.cl-app .cl-results h1 {
  color: var(--beak);
}

.cl-result-tux {
  width: auto;
  height: 220px;
}

.cl-result-tux.growing {
  animation: grow 0.9s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.cl-result-grew {
  margin-top: 12px;
  padding: 8px 14px;
  font-weight: 700;
  color: var(--toque);
  background: var(--toque-pale);
  border-radius: 12px;
}

.cl-results .cl-result-small {
  margin-top: 8px;
  font-size: 16px;
}

.cl-results-stats {
  flex-wrap: wrap;
  justify-content: center;
}

.cl-results-stats span {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Les couleurs des tuiles : points en orange, précision en vert, sardines en bleu. */
.cl-results-stats > div {
  --tone: var(--beak);
  border-color: var(--tone);
}

.cl-results-stats > .cl-stat-accuracy {
  --tone: var(--success);
}

.cl-results-stats > .cl-stat-sardines {
  --tone: var(--toque-bright);
}

.cl-results-stats > div strong {
  background: var(--tone);
}

.cl-results-stats > div span {
  color: var(--tone);
}

.cl-result-villain {
  width: auto;
  height: 240px;
}

.cl-results .cl-button {
  margin-top: 24px;
}

.cl-result-quests {
  display: grid;
  gap: 12px;
  margin-top: 24px;
  padding: 0;
  list-style: none;
}

.cl-result-quests li {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  text-align: left;
  background: var(--beak-pale);
  border-radius: 16px;
}

.cl-result-prof {
  width: 160px;
  height: 160px;
  object-fit: contain;
}

.cl-results .cl-result-moral {
  color: var(--ink);
}

.cl-result-reflexes {
  display: grid;
  gap: 8px;
  padding-left: 1.1em;
  text-align: left;
}

.cl-result-sources {
  display: grid;
  gap: 6px;
  margin-top: 28px;
}

.cl-result-sources h2 {
  font-size: 15px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.cl-result-sources a {
  font-weight: 700;
  color: var(--toque-bright);
}

.cl-results .cl-later {
  margin-top: 12px;
  border: 0;
  color: var(--toque-bright);
}

@keyframes grow {
  from {
    transform: scale(0.6);
  }
  to {
    transform: scale(1);
  }
}

@media (max-width: 699px) {
  .cl-result-tux,
  .cl-result-villain {
    height: 180px;
  }

  .cl-app .cl-results h1 {
    font-size: 26px;
    line-height: 32px;
  }

  .cl-results p {
    font-size: 17px;
  }
}
</style>
