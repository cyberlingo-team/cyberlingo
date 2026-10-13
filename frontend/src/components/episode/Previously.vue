<script setup>
// « Précédemment… » : le récitatif qui ouvre l'épisode du jour et rappelle où en est le joueur,
// à la manière du narrateur d'une série.
import { computed } from 'vue'
import MuscleName from '../tux/MuscleName.vue'
import { addDaysIso, episodeMinutes, formatDay, plural, relativeDay } from '../../lib/format.js'

const props = defineProps({
  me: { type: Object, default: null },
  progress: { type: Object, required: true },
  questionCount: { type: Number, default: 5 },
})

// Longueur de la dernière série, quand elle vient de s'arrêter.
function lastRun(days, lastPlayed) {
  const index = days.findIndex((day) => day.date === lastPlayed)
  if (index < 0) return 1
  let run = 0
  for (let i = index; i >= 0 && days[i].status === 'played'; i--) run++
  return run
}

const story = computed(() => {
  const me = props.me
  if (!me) return { kind: 'guest' }
  const { streak, stage, points } = me
  const remaining = stage.next ? stage.next.minPoints - points : 0
  if (props.progress.completed) return { kind: 'done', streak: streak.current }
  if (streak.current > 0) return { kind: 'running', streak: streak.current, stage, remaining }
  if (streak.lastPlayed) {
    const stop = addDaysIso(streak.lastPlayed, 1)
    const when = relativeDay(stop)
    return {
      kind: 'broken',
      run: lastRun(me.days, streak.lastPlayed),
      when: when === formatDay(stop) ? `le ${when}` : when,
    }
  }
  return { kind: 'first' }
})
</script>

<template>
  <p class="previously caption">
    <template v-if="story.kind === 'guest'">
      Chaque jour, un nouvel épisode. Un membre de la bande à Tux tombe sur une arnaque : à toi de la repérer avant lui,
      en {{ questionCount }} cases et {{ episodeMinutes(questionCount) }} minutes. Tux le prof corrige.
    </template>
    <template v-else-if="story.kind === 'done'">
      Épisode du jour bouclé. <MuscleName :name="me.user.username" :level="me.stage.level" class="previously-name" /> tient sa série :
      {{ plural(story.streak, 'jour') }}. Prochain épisode à minuit.
    </template>
    <template v-else-if="story.kind === 'running'">
      <span class="previously-label">Précédemment :</span>
      <MuscleName :name="me.user.username" :level="me.stage.level" class="previously-name" /> a tenu {{ plural(story.streak, 'jour') }} de suite.
      Son Tux, {{ story.stage.name }},
      <template v-if="story.stage.next">n’est plus qu’à {{ plural(story.remaining, 'point') }} du stade {{ story.stage.next.name }}.</template>
      <template v-else>a atteint le dernier stade.</template>
    </template>
    <template v-else-if="story.kind === 'broken'">
      <span class="previously-label">Précédemment :</span>
      la série de <MuscleName :name="me.user.username" :level="me.stage.level" class="previously-name" /> s’est arrêtée {{ story.when }},
      après {{ plural(story.run, 'jour') }}. Son Tux garde tous ses muscles : un épisode aujourd’hui, et c’est reparti.
    </template>
    <template v-else>
      <span class="previously-label">Précédemment :</span>
      rien du tout. Le Tux de <MuscleName :name="me.user.username" :level="me.stage.level" class="previously-name" /> vient d’éclore
      et n’a encore jamais vu d’arnaque. Tout commence aujourd’hui.
    </template>
  </p>
</template>

<style scoped>
.previously {
  justify-self: start;
  max-width: 64ch;
  font-size: 1.05rem;
  border-width: 3px;
  transform: rotate(-0.6deg);
}

.previously-label {
  font-weight: 700;
  font-style: italic;
}

.previously-name {
  font-size: 1.12em;
}
</style>
