<script setup>
// La bande à Tux : Tux le prof, ses douze cousins invités tour à tour dans les épisodes, et
// Léopold, l'escroc aux mille déguisements. Les déguisements qu'on a démasqués en jouant se
// dévoilent ; les autres restent dans l'ombre.
import { computed } from 'vue'
import Balloon from '../components/comic/Balloon.vue'
import ErrorPanel from '../components/comic/ErrorPanel.vue'
import LoadingPanel from '../components/comic/LoadingPanel.vue'
import Picture from '../components/comic/Picture.vue'
import Stamp from '../components/comic/Stamp.vue'
import { getCast, listMissions } from '../api/index.js'
import { loadSession, session } from '../lib/session.js'
import { useResource } from '../lib/resource.js'
import { gangImage, villainImage } from '../lib/images.js'
import { capitalize, formatDay, typo } from '../lib/format.js'
import profLogo from '../assets/brand/tux-prof.svg'

const { data, error, reload } = useResource(async () => {
  const [cast, list] = await Promise.all([getCast(), listMissions(), loadSession()])
  return { cast, episodes: list.episodes }
})

// La dernière apparition de chaque membre de la bande (les épisodes vont du plus récent au plus ancien).
const lastSeen = computed(() => {
  const seen = {}
  for (const episode of data.value?.episodes || []) if (!seen[episode.guest.id]) seen[episode.guest.id] = episode
  return seen
})

// Les déguisements démasqués : ceux des épisodes joués ou rattrapés jusqu'au bout.
const unmasked = computed(() => {
  const found = {}
  for (const episode of data.value?.episodes || []) {
    if (episode.villain && !found[episode.villain.id]) found[episode.villain.id] = episode
  }
  return found
})

const disguises = computed(() => data.value?.cast.villain.disguises || [])
const unmaskedCount = computed(() => disguises.value.filter((d) => unmasked.value[d.id]).length)
</script>

<template>
  <div class="page page--wide gang">
    <h1 class="page-title">La bande à Tux</h1>

    <ErrorPanel v-if="error && !data" :error="error" :retry="reload" />
    <LoadingPanel v-else-if="!data" label="Chargement des personnages" />

    <template v-else>
      <p class="lead">
        Chaque jour, un membre de la bande tombe sur une arnaque. Tu l’aides à la repérer, Tux le prof corrige, et
        Léopold repart bredouille.
      </p>

      <section class="prof panel" aria-labelledby="prof-name">
        <img :src="profLogo" class="prof-image" width="180" height="180" alt="Tux le prof, toque bleue sur la tête et baguette à la main." />
        <div class="prof-text">
          <h2 id="prof-name" class="prof-name">Tux le prof</h2>
          <p>
            Il corrige chaque case au stylo rouge, ne s’énerve jamais et soupire parfois. Ton Tux, lui, commence poussin
            et prend du muscle à chaque épisode.
          </p>
          <Balloon tail="left" class="prof-balloon">Un message pressé qui réclame ton code ? C’est déjà un indice.</Balloon>
        </div>
      </section>

      <section class="block" aria-labelledby="cousins-title">
        <h2 id="cousins-title" class="block-title">Les cousins</h2>
        <ul class="cousins">
          <li v-for="member in data.cast.gang" :key="member.id" class="cousin panel">
            <div class="cousin-art">
              <Picture class="cousin-image" :image="gangImage(member.id)" :alt="member.look" />
            </div>
            <h3 class="cousin-name">{{ capitalize(member.name) }}</h3>
            <p class="cousin-tagline">{{ typo(member.tagline) }}</p>
            <p class="cousin-seen">
              <template v-if="lastSeen[member.id]">
                Vu dans
                <RouterLink :to="lastSeen[member.id].status === 'today' ? '/' : `/episode/${lastSeen[member.id].date}`">{{ typo(`« ${lastSeen[member.id].title} »`) }}</RouterLink>,
                {{ formatDay(lastSeen[member.id].date) }}.
              </template>
              <template v-else>Pas encore invité dans un épisode.</template>
            </p>
          </li>
        </ul>
      </section>

      <section class="villain panel" aria-labelledby="villain-name">
        <div class="villain-head">
          <Picture class="villain-image" :image="villainImage('leopold')" alt="Léopold, un léopard de mer debout, sourire en coin." />
          <div class="villain-text">
            <h2 id="villain-name" class="villain-name">{{ data.cast.villain.name }}</h2>
            <p>{{ typo(data.cast.villain.tagline) }}</p>
            <p class="villain-count">
              <Stamp tone="alert">{{ unmaskedCount }} sur {{ disguises.length }}</Stamp>
              <span>
                {{
                  unmaskedCount === 0
                    ? session.user
                      ? 'Aucun déguisement démasqué pour l’instant. Finis un épisode pour lui arracher le premier.'
                      : 'Joue les épisodes jusqu’au bout pour démasquer ses déguisements.'
                    : unmaskedCount === disguises.length
                      ? 'Tous ses déguisements sont démasqués. Il va devoir en coudre d’autres.'
                      : 'déguisements démasqués. Les autres attendent dans l’ombre.'
                }}
              </span>
            </p>
          </div>
        </div>

        <ul class="disguises">
          <li v-for="disguise in disguises" :key="disguise.id" class="disguise" :class="{ 'is-hidden': !unmasked[disguise.id] }">
            <Picture
              class="disguise-image"
              :image="villainImage(disguise.id)"
              :alt="unmasked[disguise.id] ? `Léopold ${disguise.label}` : 'Déguisement pas encore démasqué'"
            />
            <p class="disguise-label">
              <template v-if="unmasked[disguise.id]">
                {{ capitalize(disguise.label) }}
                <RouterLink class="disguise-link" :to="`/episode/${unmasked[disguise.id].date}`">
                  épisode {{ unmasked[disguise.id].number }}
                </RouterLink>
              </template>
              <template v-else>?</template>
            </p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.gang {
  gap: calc(var(--gutter) * 1.3);
}

.block {
  display: grid;
  gap: 10px;
}

.block-title {
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  font-weight: 850;
  font-stretch: 106%;
}

/* Tux le prof */
.prof {
  display: grid;
  grid-template-columns: minmax(100px, 180px) 1fr;
  gap: 18px;
  align-items: center;
  padding: clamp(14px, 3.5vw, 24px);
  background: var(--toque-pale);
}

.prof-image {
  width: 100%;
  height: auto;
}

.prof-text {
  display: grid;
  gap: 10px;
  max-width: 62ch;
}

.prof-name,
.villain-name {
  font-size: clamp(1.8rem, 6vw, 2.6rem);
  font-weight: 900;
  font-stretch: 114%;
}

.prof-balloon {
  justify-self: start;
}

/* Les cousins */
.cousins {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
  gap: 12px;
}

.cousin {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 6px;
  padding: 12px 14px 14px;
}

.cousin-art {
  display: grid;
  place-items: center;
  height: 150px;
  margin: -12px -14px 4px;
  background-image: radial-gradient(var(--caption) 2.6px, transparent 3px);
  background-size: 9px 9px;
  border-bottom: 2px solid var(--ink);
}

.cousin-image {
  width: auto;
  max-width: 85%;
  max-height: 130px;
  object-fit: contain;
}

.cousin-name {
  font-size: 1.35rem;
  font-weight: 880;
  font-stretch: 108%;
}

.cousin-tagline {
  font-size: 0.98rem;
}

.cousin-seen {
  font-size: 0.86rem;
  color: var(--muted);
}

/* Léopold */
.villain {
  display: grid;
  gap: 18px;
  padding: clamp(14px, 3.5vw, 24px);
  border-color: var(--alert);
  border-width: 4px;
}

.villain-head {
  display: grid;
  grid-template-columns: minmax(80px, 140px) 1fr;
  gap: 18px;
  align-items: center;
}

.villain-image {
  max-height: 260px;
  width: auto;
  justify-self: center;
}

.villain-text {
  display: grid;
  gap: 10px;
  max-width: 60ch;
}

.villain-count {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
}

.disguises {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(46%, 120px), 1fr));
  gap: 10px;
}

.disguise {
  display: grid;
  justify-items: center;
  align-content: end;
  gap: 6px;
  padding: 10px 6px 8px;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.disguise-image {
  width: auto;
  height: 130px;
  object-fit: contain;
}

.is-hidden {
  background: var(--page);
  border-style: dashed;
}

.is-hidden .disguise-image {
  filter: brightness(0);
  opacity: 0.85;
}

.disguise-label {
  font-family: var(--font-title);
  font-weight: 750;
  font-size: 0.9rem;
  text-align: center;
  line-height: 1.15;
}

.is-hidden .disguise-label {
  font-size: 1.3rem;
  font-weight: 900;
}

.disguise-link {
  display: block;
  font-family: var(--font-hand);
  font-weight: 500;
  font-size: 0.82rem;
}

@media (max-width: 560px) {
  .prof,
  .villain-head {
    grid-template-columns: 90px 1fr;
    align-items: start;
  }

  .cousins {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .cousin {
    padding: 10px 10px 12px;
  }

  .cousin-art {
    height: 112px;
    margin: -10px -10px 4px;
  }

  .cousin-image {
    max-height: 96px;
  }

  .cousin-name {
    font-size: 1.15rem;
  }

  .cousin-tagline {
    font-size: 0.9rem;
  }

  .disguises {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .disguise-image {
    height: 84px;
  }
}
</style>
