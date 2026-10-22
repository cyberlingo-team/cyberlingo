<script setup>
// L'aide, à la manière du centre d'aide de la copie de référence : une page à part, avec un
// retour, et les questions qu'on déplie. D'abord que faire pour de vrai quand on s'est fait
// avoir, puis comment marche CyberLingo. Les chiffres viennent du serveur (barème de la mission
// du jour, réserve du joueur) ; ceux qu'aucune route ne donne sont dits sans chiffre.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/app/Icon.vue'
import { getGame } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { inventory, loadInventory } from '../lib/inventory.js'
import { plural } from '../lib/format.js'

const router = useRouter()

loadInventory()
const { data: game } = useResource(getGame)

const scoring = computed(() => game.value?.scoring || null)
const buoys = computed(() => inventory.data?.buoys.max ?? null)
const freezes = computed(() => inventory.data?.freezes.max ?? null)

// Retour à la page précédente du site, ou au chemin si on arrive directement ici.
function back() {
  if (window.history.state?.back) router.back()
  else router.push('/apprendre')
}
</script>

<template>
  <div class="cl-app cl-settings">
    <header>
      <a href="/apprendre" aria-label="Retour" @click.prevent="back">
        <svg viewBox="0 0 17 17" aria-hidden="true"><path d="M3.6 8.1h12.1M8.2 2.1 2.3 8l5.9 5.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
      <strong>Centre d’aide</strong>
    </header>

    <main id="contenu" tabindex="-1">
      <section>
        <h1>Centre d’aide</h1>

        <div class="urgent" role="note" aria-labelledby="urgent-title">
          <h2 id="urgent-title">Tu as cliqué sur un lien piégé ?</h2>
          <ol>
            <li><strong>Tu as donné ta carte bancaire :</strong> appelle tout de suite ta banque, ou le numéro d’opposition au dos de la carte, pour la bloquer.</li>
            <li><strong>Tu as tapé un mot de passe :</strong> change-le sur le vrai site, et partout où tu utilisais le même.</li>
            <li><strong>Pour savoir quoi faire ensuite :</strong> le <a href="https://www.17cyber.gouv.fr" target="_blank" rel="noopener">17Cyber</a> et <a href="https://www.cybermalveillance.gouv.fr" target="_blank" rel="noopener">cybermalveillance.gouv.fr</a> te guident pas à pas, gratuitement.</li>
            <li><strong>Un SMS d’arnaque :</strong> transfère-le au <strong>33700</strong>, le numéro de signalement des SMS indésirables, puis supprime-le.</li>
          </ol>
        </div>

        <h2>Comment marche CyberLingo</h2>

        <details open>
          <summary><Icon name="igloo" :size="30" />Comment marche le chemin ?</summary>
          <p>Le chemin d’« Apprendre » range les leçons par thème : l’hameçonnage, les mots de passe, le téléphone… Chaque leçon se débloque quand tu as fini la précédente.</p>
          <p>Au milieu de chaque thème t’attend un coffre plein de sardines, et à la fin un bilan qui reprend une question de chaque leçon. Le bouton « Guide » d’un thème résume ses bons réflexes.</p>
        </details>

        <details>
          <summary><Icon name="flamme" :size="30" />Qu’est-ce que la mission du jour ?</summary>
          <p>Chaque jour, une nouvelle mission, la même pour tout le monde, se joue en tête du chemin. C’est elle qui fait avancer ta série, et elle rapporte plus que les leçons.</p>
          <p>Elle ne coûte jamais de bouée. À la fin, tu découvres qui se cachait derrière l’arnaque.</p>
        </details>

        <details>
          <summary><Icon name="haltere" :size="30" />Comment gagner des points et faire grandir mon Tux ?</summary>
          <p v-if="scoring">
            Dans la mission du jour, chaque bonne réponse rapporte {{ plural(scoring.correctAnswer, 'point') }}, un sans-faute {{ scoring.perfectBonus }} de plus, et ta série ajoute
            {{ plural(scoring.streakBonusPerDay, 'point') }} par jour (jusqu’à {{ scoring.streakBonusMaxDays }} jours).
          </p>
          <p v-else>Dans la mission du jour, chaque bonne réponse rapporte des points, avec un bonus pour un sans-faute et pour ta série.</p>
          <p>Une leçon du chemin rapporte des points la première fois que tu la finis ; la rejouer sert à réviser.</p>
          <p>Tous tes points font prendre du muscle à ton Tux, du Poussin au Brise-glace. Va voir « Mon Tux » pour savoir combien il t’en manque.</p>
        </details>

        <details>
          <summary><Icon name="glacon" :size="30" />La série et les glaçons</summary>
          <p>Ta série compte les jours d’affilée où tu as fait la mission du jour. Un jour sans mission, et elle retombe à zéro.</p>
          <p>Sauf si tu as un glaçon : il gèle ta série le jour manqué, tout seul. Tu en trouves à la boutique<template v-if="freezes">, et tu peux en garder {{ freezes }} d’avance</template>.</p>
        </details>

        <details>
          <summary><Icon name="bouee" :size="30" />Les sardines et les bouées</summary>
          <p>Les sardines sont la monnaie de la banquise. Tu en gagnes en finissant des leçons, en ouvrant les coffres du chemin et en réussissant tes quêtes ; tu les dépenses à la boutique.</p>
          <p>
            Les bouées sont tes vies<template v-if="buoys"> : tu en as {{ buoys }}</template>. Chaque erreur dans une leçon en coûte une. Plus de bouée, plus de leçon : elles se regonflent toutes la nuit,
            ou tout de suite à la boutique. La mission du jour, elle, reste toujours jouable.
          </p>
        </details>

        <details>
          <summary><Icon name="coffre" :size="30" />Les quêtes</summary>
          <p>Chaque jour, trois quêtes te proposent un petit objectif : faire la mission du jour, gagner des points, réussir un sans-faute… Chacune réussie remplit ta réserve de sardines, sans rien à réclamer.</p>
          <p>Le défi du mois, lui, se remplit avec toutes tes bonnes réponses du mois.</p>
        </details>

        <details>
          <summary><Icon name="podium" :size="30" />Le classement</summary>
          <p>Le classement de la semaine compte les points des sept derniers jours ; celui de toujours, tous les points depuis ton arrivée. Il faut un profil pour y entrer.</p>
          <p>La mission du jour est le meilleur moyen de grimper : c’est elle qui rapporte le plus.</p>
        </details>

        <p class="help-foot">
          Une autre question ? Les sources de chaque leçon sont dans son bilan et dans le guide de chaque thème.
          <RouterLink to="/credits">Crédits du site</RouterLink> · <RouterLink to="/">Accueil</RouterLink>
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.cl-settings > header a {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: #9aa0b4;
}

.cl-settings > header svg {
  width: 22px;
  height: 22px;
}

main {
  max-width: 820px;
  margin: 24px auto 0;
}

main:focus {
  outline: none;
}

main > section > h1 {
  margin-bottom: 32px;
}

.urgent {
  padding: 20px 24px;
  background: var(--alert-pale);
  border: 2px solid #f2aaa4;
  border-radius: 16px;
}

.cl-app .urgent h2 {
  margin: 0 0 12px;
  padding: 0;
  font-size: 20px;
  color: var(--alert-ink);
  border: 0;
}

.urgent + h2 {
  margin-top: 32px;
}

.urgent ol {
  display: grid;
  gap: 8px;
  padding-left: 1.2em;
  line-height: 1.5;
}

.urgent a,
.help-foot a {
  font-weight: 700;
  color: var(--toque-bright);
  text-decoration: underline;
}

.cl-settings summary {
  display: flex;
  align-items: center;
  gap: 14px;
  list-style: none;
}

.cl-settings summary::-webkit-details-marker {
  display: none;
}

.cl-settings summary::after {
  content: '';
  width: 10px;
  height: 10px;
  margin-left: auto;
  border-right: 3px solid #9aa0b4;
  border-bottom: 3px solid #9aa0b4;
  transform: rotate(45deg);
  transition: transform 0.15s;
}

.cl-settings details[open] summary::after {
  transform: rotate(225deg);
}

.cl-settings details p {
  margin: 12px 0 0 44px;
  line-height: 1.5;
}

.help-foot {
  margin-top: 32px;
  color: var(--muted);
}

@media (max-width: 699px) {
  .cl-settings details p {
    margin-left: 0;
  }

  .cl-settings summary {
    font-size: 17px;
  }
}
</style>
