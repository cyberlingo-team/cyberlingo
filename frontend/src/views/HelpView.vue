<script setup>
// L'aide : comment marche CyberLingo, et que faire pour de vrai quand on s'est fait avoir.
// Les chiffres viennent du serveur (barème de la mission du jour, réserve du joueur) ; ceux
// qu'aucune route ne donne (leçons, sardines) sont dits sans chiffre, voir api/simulation/rules.js.
import { computed } from 'vue'
import AppShell from '../components/app/AppShell.vue'
import Icon from '../components/app/Icon.vue'
import { getGame } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { inventory, loadInventory } from '../lib/inventory.js'
import { plural } from '../lib/format.js'

loadInventory()
const { data: game } = useResource(getGame)

const scoring = computed(() => game.value?.scoring || null)
const buoys = computed(() => inventory.data?.buoys.max ?? null)
const freezes = computed(() => inventory.data?.freezes.max ?? null)
</script>

<template>
  <AppShell width="text">
    <div class="help">
      <header class="help-head">
        <h1 class="section-title">Aide</h1>
        <p class="muted">Tout ce qu’il faut savoir pour avancer sur la banquise, et quoi faire si une arnaque t’a vraiment piégé.</p>
      </header>

      <section class="card urgent" aria-labelledby="urgent-title">
        <h2 id="urgent-title" class="urgent-title">Tu as cliqué sur un lien piégé ?</h2>
        <ol class="urgent-steps">
          <li><strong>Tu as donné ta carte bancaire :</strong> appelle tout de suite ta banque, ou le numéro d’opposition au dos de la carte, pour la bloquer.</li>
          <li><strong>Tu as tapé un mot de passe :</strong> change-le sur le vrai site, et partout où tu utilisais le même.</li>
          <li><strong>Pour savoir quoi faire ensuite :</strong> le <a href="https://www.17cyber.gouv.fr" target="_blank" rel="noopener">17Cyber</a> et <a href="https://www.cybermalveillance.gouv.fr" target="_blank" rel="noopener">cybermalveillance.gouv.fr</a> te guident pas à pas, gratuitement.</li>
          <li><strong>Un SMS d’arnaque :</strong> transfère-le au <strong>33700</strong>, le numéro de signalement des SMS indésirables, puis supprime-le.</li>
        </ol>
      </section>

      <section class="faq" aria-labelledby="faq-title">
        <h2 id="faq-title" class="visually-hidden">Questions fréquentes</h2>

        <details class="card item" open>
          <summary><Icon name="igloo" :size="34" /><span>Comment marche le chemin ?</span></summary>
          <div class="answer">
            <p>Le chemin d’« Apprendre » range les leçons par thème : l’hameçonnage, les mots de passe, le téléphone… Chaque leçon se débloque quand tu as fini la précédente.</p>
            <p>Au milieu de chaque thème t’attend un coffre plein de sardines, et à la fin un bilan qui reprend une question de chaque leçon. Le bouton « Guide » d’un thème résume ses bons réflexes.</p>
          </div>
        </details>

        <details class="card item">
          <summary><Icon name="flamme" :size="34" /><span>Qu’est-ce que la mission du jour ?</span></summary>
          <div class="answer">
            <p>Chaque jour, une nouvelle mission, la même pour tout le monde, se joue en tête du chemin. C’est elle qui fait avancer ta série, et elle rapporte plus que les leçons.</p>
            <p>Elle ne coûte jamais de bouée. À la fin, tu découvres qui se cachait derrière l’arnaque.</p>
          </div>
        </details>

        <details class="card item">
          <summary><Icon name="haltere" :size="34" /><span>Comment gagner des points et faire grandir mon Tux ?</span></summary>
          <div class="answer">
            <p v-if="scoring">
              Dans la mission du jour, chaque bonne réponse rapporte {{ plural(scoring.correctAnswer, 'point') }}, un sans-faute {{ scoring.perfectBonus }} de plus, et ta série ajoute
              {{ plural(scoring.streakBonusPerDay, 'point') }} par jour (jusqu’à {{ scoring.streakBonusMaxDays }} jours).
            </p>
            <p v-else>Dans la mission du jour, chaque bonne réponse rapporte des points, avec un bonus pour un sans-faute et pour ta série.</p>
            <p>Une leçon du chemin rapporte des points la première fois que tu la finis ; la rejouer sert à réviser.</p>
            <p>Tous tes points font prendre du muscle à ton Tux, du Poussin au Brise-glace. Va voir « Mon Tux » pour savoir combien il t’en manque.</p>
          </div>
        </details>

        <details class="card item">
          <summary><Icon name="glacon" :size="34" /><span>La série et les glaçons</span></summary>
          <div class="answer">
            <p>Ta série compte les jours d’affilée où tu as fait la mission du jour. Un jour sans mission, et elle retombe à zéro.</p>
            <p>Sauf si tu as un glaçon : il gèle ta série le jour manqué, tout seul. Tu en trouves à la boutique<template v-if="freezes">, et tu peux en garder {{ freezes }} d’avance</template>.</p>
          </div>
        </details>

        <details class="card item">
          <summary><Icon name="bouee" :size="34" /><span>Les sardines et les bouées</span></summary>
          <div class="answer">
            <p>Les sardines sont la monnaie de la banquise. Tu en gagnes en finissant des leçons, en ouvrant les coffres du chemin et en réussissant tes quêtes ; tu les dépenses à la boutique.</p>
            <p>
              Les bouées sont tes vies<template v-if="buoys"> : tu en as {{ buoys }}</template>. Chaque erreur dans une leçon en coûte une. Plus de bouée, plus de leçon : elles se regonflent toutes la
              nuit, ou tout de suite à la boutique. La mission du jour, elle, reste toujours jouable.
            </p>
          </div>
        </details>

        <details class="card item">
          <summary><Icon name="coffre" :size="34" /><span>Les quêtes</span></summary>
          <div class="answer">
            <p>Chaque jour, trois quêtes te proposent un petit objectif : faire la mission du jour, gagner des points, réussir un sans-faute… Chacune réussie remplit ta réserve de sardines, sans rien à réclamer.</p>
            <p>Le défi du mois, lui, se remplit avec toutes tes bonnes réponses du mois.</p>
          </div>
        </details>

        <details class="card item">
          <summary><Icon name="podium" :size="34" /><span>Le classement</span></summary>
          <div class="answer">
            <p>Le classement de la semaine compte les points des sept derniers jours ; celui de toujours, tous les points depuis ton arrivée. Il faut un profil pour y entrer.</p>
            <p>La mission du jour est le meilleur moyen de grimper : c’est elle qui rapporte le plus.</p>
          </div>
        </details>
      </section>

      <p class="help-foot muted">
        Une autre question ? Les sources de chaque leçon sont dans son bilan et dans le guide de chaque thème.
        <RouterLink to="/credits">Crédits du site</RouterLink>
      </p>
    </div>
  </AppShell>
</template>

<style scoped>
.help {
  display: grid;
  gap: 24px;
}

.help-head {
  display: grid;
  gap: 6px;
}

.urgent {
  display: grid;
  gap: 12px;
  padding: 20px;
  background: var(--alert-pale);
  border-color: #f6c3be;
}

.urgent-title {
  font-size: 1.2rem;
  color: var(--alert-ink);
}

.urgent-steps {
  display: grid;
  gap: 8px;
  padding-left: 1.2em;
}

.faq {
  display: grid;
  gap: 12px;
}

.item summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  font-size: 1.05rem;
  font-weight: 800;
  list-style: none;
  cursor: pointer;
}

.item summary::-webkit-details-marker {
  display: none;
}

.item summary::after {
  content: '';
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-left: auto;
  border-right: 3px solid #9aa0b4;
  border-bottom: 3px solid #9aa0b4;
  transform: rotate(45deg);
  transition: transform 0.15s;
}

.item[open] summary::after {
  transform: rotate(-135deg);
}

.item summary:hover {
  background: var(--wash);
  border-radius: var(--radius);
}

.answer {
  display: grid;
  gap: 8px;
  padding: 0 20px 18px 66px;
}

.help-foot {
  font-size: 0.92rem;
  text-align: center;
}

@media (max-width: 520px) {
  .answer {
    padding-left: 20px;
  }
}
</style>
