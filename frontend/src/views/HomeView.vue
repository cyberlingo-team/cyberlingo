<script setup>
// L'accueil, pour qui ne connaît pas encore CyberLingo, sur le modèle de la copie de référence :
// le héros en plein écran avec le bandeau des thèmes, des sections alternées, le bandeau de
// Léopold, l'appel final et le pied de page. Un joueur connecté n'y passe pas : le routeur
// l'envoie à son chemin.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Logo from '../components/app/Logo.vue'
import Icon from '../components/app/Icon.vue'
import { getPath } from '../api/index.js'
import { useResource } from '../lib/resource.js'
import { sceneImage, stageImage, villainImage } from '../lib/images.js'
import '../styles/home.css'

const hero = sceneImage('heros')
const mission = sceneImage('mission')
const quests = sceneImage('quetes')
const stages = [0, 2, 4, 7].map((level) => stageImage(level))
const row = Array.from({ length: 8 }, (_, level) => stageImage(level, { mini: true }))
const disguised = villainImage('fisher')
const unmasked = villainImage('unmasked')

// Les thèmes du chemin, demandés au serveur comme sur la page Apprendre.
const { data: path } = useResource(getPath)

const scrolled = ref(false)
const themeList = ref(null)

function onScroll() {
  scrolled.value = window.scrollY > 560
}

function moveThemes(direction) {
  themeList.value?.scrollBy({ left: direction * 400, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="home">
    <header class="home-masthead">
      <div class="home-topbar" :class="{ 'home-topbar--scrolled': scrolled }">
        <nav class="home-topnav" aria-label="En-tête">
          <RouterLink to="/" class="home-logo"><Logo /></RouterLink>
          <RouterLink v-if="scrolled" to="/bienvenue" class="home-button home-button--main home-button--small"><span>C’est parti !</span></RouterLink>
          <RouterLink v-else to="/connexion" class="home-button home-button--small"><span>Se connecter</span></RouterLink>
        </nav>
      </div>

      <main id="contenu" class="home-hero" tabindex="-1">
        <div class="home-hero__art">
          <img :src="hero.src" :width="hero.width" :height="hero.height" alt="Tux le prof montre, avec sa règle, l’hameçon qui sort d’un téléphone géant." />
        </div>
        <div class="home-hero__copy">
          <h1>La façon gratuite, ludique et efficace d’apprendre à déjouer les arnaques en ligne !</h1>
          <div class="home-hero__actions">
            <RouterLink to="/bienvenue" class="home-button home-button--main"><span>C’est parti !</span></RouterLink>
            <RouterLink to="/connexion" class="home-button"><span>J’ai déjà un profil</span></RouterLink>
          </div>
        </div>
      </main>

      <div v-if="path?.units?.length" class="home-themes">
        <nav aria-label="Les thèmes">
          <button type="button" aria-label="Thèmes précédents" @click="moveThemes(-1)">
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="m9 2-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <div ref="themeList" class="home-themes__clip">
            <ul>
              <li v-for="unit in path.units" :key="unit.id">
                <RouterLink to="/bienvenue">
                  <img v-if="unit.villain" :src="villainImage(unit.villain).src" alt="" />
                  <span>{{ unit.title }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
          <button type="button" aria-label="Thèmes suivants" @click="moveThemes(1)">
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="m5 2 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </nav>
      </div>
    </header>

    <div class="home-features">
      <section class="home-feature">
        <div class="home-feature__copy">
          <h2>gratuit. ludique. efficace.</h2>
          <p>
            Chaque matin, la mission du jour : la même pour tout le monde, cinq minutes pour repérer un faux SMS, un
            faux mail ou un faux site. Elle fait avancer ta série. Entre deux, un chemin de leçons courtes, des
            faux colis aux objets connectés, avec un coffre et un bilan à chaque thème.
          </p>
        </div>
        <div class="home-feature__art">
          <img :src="mission.src" :width="mission.width" :height="mission.height" alt="" loading="lazy" />
        </div>
      </section>

      <section class="home-feature home-feature--reverse">
        <div class="home-feature__copy">
          <h2>ton Tux prend du muscle</h2>
          <p>
            Chaque bonne réponse rapporte des points, et tes points font grossir ton Tux : huit stades, du poussin
            dans sa coquille au brise-glace. Compare-toi aux autres dans le classement de la semaine.
          </p>
        </div>
        <div class="home-feature__art home-stages" aria-hidden="true">
          <img v-for="(stage, index) in stages" :key="index" :src="stage.src" alt="" loading="lazy" />
        </div>
      </section>

      <section class="home-feature">
        <div class="home-feature__copy">
          <h2>reste motivé</h2>
          <p>
            Trois quêtes chaque jour et un défi chaque mois remplissent ta réserve de sardines. À la boutique,
            elles regonflent tes bouées ou t’offrent un glaçon qui protège ta série un jour d’absence.
          </p>
          <ul class="home-items">
            <li><Icon name="sardine" :size="40" />Sardines</li>
            <li><Icon name="bouee" :size="34" />Bouées</li>
            <li><Icon name="glacon" :size="34" />Glaçons</li>
          </ul>
        </div>
        <div class="home-feature__art">
          <img :src="quests.src" :width="quests.width" :height="quests.height" alt="" loading="lazy" />
        </div>
      </section>
    </div>

    <section class="home-villain">
      <div class="home-villain__art" aria-hidden="true">
        <img :src="disguised.src" alt="" loading="lazy" />
        <img :src="unmasked.src" alt="" loading="lazy" />
      </div>
      <div class="home-villain__copy">
        <h2>Démasque Léopold</h2>
        <p>
          Derrière chaque arnaque se cache Léopold, un léopard de mer escroc qui change de déguisement : pêcheur,
          livreur, faux conseiller… Repère ses indices dans de vrais faux messages, et retire-lui son masque.
        </p>
        <RouterLink to="/bienvenue" class="home-button home-button--white"><span>Je relève le défi</span></RouterLink>
      </div>
    </section>

    <section class="home-ending">
      <div class="home-ending__copy">
        <h2>le meilleur antivirus, c’est toi.</h2>
        <RouterLink to="/bienvenue" class="home-button home-button--main"><span>C’est parti !</span></RouterLink>
      </div>
      <div class="home-ending__row" aria-hidden="true">
        <img v-for="(stage, index) in row" :key="index" :src="stage.src" alt="" loading="lazy" />
      </div>
    </section>

    <footer class="home-footer">
      <div class="home-footer__columns">
        <div>
          <h3>CyberLingo</h3>
          <ul>
            <li><RouterLink to="/bienvenue">Commencer</RouterLink></li>
            <li><RouterLink to="/apprendre">Le chemin</RouterLink></li>
            <li><RouterLink to="/mission-du-jour">La mission du jour</RouterLink></li>
          </ul>
        </div>
        <div>
          <h3>Ton profil</h3>
          <ul>
            <li><RouterLink to="/inscription">Créer un profil</RouterLink></li>
            <li><RouterLink to="/connexion">Se connecter</RouterLink></li>
            <li><RouterLink to="/preferences">Préférences</RouterLink></li>
          </ul>
        </div>
        <div>
          <h3>Aide et infos</h3>
          <ul>
            <li><RouterLink to="/aide">Aide</RouterLink></li>
            <li><RouterLink to="/credits">Crédits</RouterLink></li>
          </ul>
        </div>
      </div>
      <p class="home-footer__note">Un projet d’apprentis de l’N7, pour apprendre à repérer les pièges en ligne.</p>
    </footer>
  </div>
</template>
