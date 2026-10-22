<script setup>
// Les cartes de la colonne de droite : sa place au classement de la semaine (joueur connecté),
// les quêtes du jour, et pour un visiteur l'invitation à créer son profil.
import { computed, watch } from 'vue'
import Icon from './Icon.vue'
import QuestCard from './QuestCard.vue'
import { session } from '../../lib/session.js'
import { useResource } from '../../lib/resource.js'
import { getLeaderboard, getQuests } from '../../api/index.js'
import { plural } from '../../lib/format.js'

const props = defineProps({
  // La page des quêtes les montre déjà : inutile de les répéter à droite.
  showQuests: { type: Boolean, default: true },
})

const quests = useResource(() => (props.showQuests ? getQuests() : Promise.resolve(null)))
const board = useResource(() => (session.user ? getLeaderboard('week') : Promise.resolve(null)))
// La session arrive parfois après l'affichage : on recharge le classement quand elle change.
watch(
  () => session.user?.username,
  () => board.reload(),
)
const me = computed(() => board.data.value?.me || null)
</script>

<template>
  <section class="cl-panel cl-league-teaser">
    <strong>Classement de la semaine</strong>
    <div>
      <Icon name="podium" :size="52" />
      <p v-if="me">
        Tu es <b>{{ me.rank }}<sup>{{ me.rank === 1 ? 'er' : 'e' }}</sup></b> sur {{ board.data.value.players }}.
        <template v-if="me.ahead">Encore {{ plural(me.ahead.gap, 'point') }} pour passer {{ me.ahead.username }}.</template>
        <template v-else>Personne devant toi !</template>
        <RouterLink to="/classement">Voir le classement</RouterLink>
      </p>
      <p v-else-if="session.user">Fais la mission du jour pour entrer au classement de la semaine.</p>
      <p v-else>Crée ton profil et fais la mission du jour pour entrer dans la compétition.</p>
    </div>
  </section>

  <section v-if="quests.data.value" class="cl-panel">
    <div class="cl-panel-heading">
      <strong>Quêtes du jour</strong>
      <RouterLink to="/quetes">Tout voir</RouterLink>
    </div>
    <QuestCard v-for="quest in quests.data.value.daily" :key="quest.id" :quest="quest" />
  </section>

  <section v-if="session.status === 'ready' && !session.user" class="cl-panel cl-create-profile">
    <strong>Crée un profil pour garder ta progression !</strong>
    <RouterLink class="cl-button green" to="/inscription">Créer un profil</RouterLink>
    <RouterLink class="cl-button blue" to="/connexion">Se connecter</RouterLink>
  </section>
</template>

<style scoped>
.cl-league-teaser a {
  display: block;
  margin-top: 4px;
  font-weight: 700;
  color: var(--toque-bright);
}

.cl-panel .cl-quest-card + .cl-quest-card {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid var(--rule);
}
</style>
