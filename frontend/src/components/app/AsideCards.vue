<script setup>
// Les cartes de la colonne de droite : créer son profil (visiteur), sa place au classement de
// la semaine (joueur connecté) et les quêtes du jour.
import { computed, watch } from 'vue'
import Icon from './Icon.vue'
import QuestList from './QuestList.vue'
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
  <section v-if="session.status === 'ready' && !session.user" class="card card--pad aside-card">
    <h2 class="aside-title">Crée un profil pour garder ta progression !</h2>
    <p class="muted">Ta série, tes points et ta place au classement t’attendront demain.</p>
    <div class="aside-actions">
      <RouterLink class="button button--wide" to="/inscription">Créer un profil</RouterLink>
      <RouterLink class="button button--blue button--wide" to="/connexion">Se connecter</RouterLink>
    </div>
  </section>

  <section v-if="session.user && board.data.value" class="card card--pad aside-card">
    <div class="aside-head">
      <h2 class="aside-title">Classement de la semaine</h2>
      <RouterLink to="/classement" class="aside-more">Voir</RouterLink>
    </div>
    <div class="rank-line">
      <Icon name="podium" :size="52" />
      <p v-if="me">
        Tu es <strong>{{ me.rank }}<sup>{{ me.rank === 1 ? 'er' : 'e' }}</sup></strong> sur {{ board.data.value.players }}.
        <template v-if="me.ahead">Encore {{ plural(me.ahead.gap, 'point') }} pour passer {{ me.ahead.username }}.</template>
        <template v-else>Personne devant toi !</template>
      </p>
      <p v-else>Fais la mission du jour pour entrer au classement de la semaine.</p>
    </div>
  </section>

  <section v-if="quests.data.value" class="card card--pad aside-card">
    <div class="aside-head">
      <h2 class="aside-title">Quêtes du jour</h2>
      <RouterLink to="/quetes" class="aside-more">Tout voir</RouterLink>
    </div>
    <QuestList :quests="quests.data.value.daily" compact />
  </section>
</template>

<style scoped>
.aside-card {
  display: grid;
  gap: 12px;
}

.aside-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.aside-title {
  font-size: 1.2rem;
}

.aside-more {
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.aside-actions {
  display: grid;
  gap: 12px;
  margin-top: 6px;
}

.rank-line {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--muted);
}

.rank-line strong {
  color: var(--ink);
}
</style>
