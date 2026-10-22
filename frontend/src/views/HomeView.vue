<script setup>
// L'accueil, pour qui ne connaît pas encore CyberLingo : la promesse, puis ce qu'on y trouve,
// en sections alternées. Un joueur connecté n'y passe pas : le routeur l'envoie à son chemin.
import Logo from '../components/app/Logo.vue'
import Icon from '../components/app/Icon.vue'
import { sceneImage, stageImage, villainImage } from '../lib/images.js'

const hero = sceneImage('heros')
const mission = sceneImage('mission')
const quests = sceneImage('quetes')
const stages = [0, 2, 4, 7].map((level) => stageImage(level))
const disguised = villainImage('fisher')
const unmasked = villainImage('unmasked')
</script>

<template>
  <div class="home">
    <header class="home-top">
      <div class="home-top-inner">
        <RouterLink to="/" class="home-logo"><Logo /></RouterLink>
        <RouterLink to="/connexion" class="button button--ghost button--small">Se connecter</RouterLink>
      </div>
    </header>

    <main id="contenu" tabindex="-1">
      <section class="hero">
        <img :src="hero.src" :width="hero.width" :height="hero.height" alt="Tux le prof montre, avec sa règle, l’hameçon qui sort d’un téléphone géant." class="hero-image" />
        <div class="hero-text">
          <h1 class="hero-title">Apprends à déjouer les arnaques en ligne, cinq minutes par jour.</h1>
          <p class="hero-sub">Gratuit, ludique, et sans adresse e-mail.</p>
          <div class="hero-actions">
            <RouterLink to="/bienvenue" class="button button--wide">C’est parti</RouterLink>
            <RouterLink to="/connexion" class="button button--ghost button--wide">J’ai déjà un profil</RouterLink>
          </div>
        </div>
      </section>

      <section class="feature">
        <div class="feature-text">
          <h2 class="feature-title">Une mission par jour, un chemin à ton rythme</h2>
          <p>
            Chaque matin, la mission du jour : la même pour tout le monde, elle fait avancer ta série. Entre deux, un
            chemin de leçons courtes, des faux SMS aux objets connectés, avec un coffre et un bilan à chaque thème.
          </p>
        </div>
        <img :src="mission.src" :width="mission.width" :height="mission.height" alt="" class="feature-image" loading="lazy" />
      </section>

      <section class="feature feature--reverse">
        <div class="feature-text">
          <h2 class="feature-title">Ton Tux prend du muscle</h2>
          <p>
            Chaque bonne réponse rapporte des points, et tes points font grossir ton Tux : huit stades, du poussin
            dans sa coquille au brise-glace. Compare-toi aux autres dans le classement de la semaine.
          </p>
        </div>
        <div class="feature-stages" aria-hidden="true">
          <img v-for="(stage, index) in stages" :key="index" :src="stage.src" alt="" loading="lazy" />
        </div>
      </section>

      <section class="feature">
        <div class="feature-text">
          <h2 class="feature-title">Des quêtes, des sardines et des bouées</h2>
          <p>
            Trois quêtes chaque jour et un défi chaque mois remplissent ta réserve de sardines. À la boutique, elles
            regonflent tes bouées ou t’offrent un glaçon qui protège ta série un jour d’absence.
          </p>
          <ul class="feature-items">
            <li><Icon name="sardine" :size="40" /><span>Sardines</span></li>
            <li><Icon name="bouee" :size="36" /><span>Bouées</span></li>
            <li><Icon name="glacon" :size="36" /><span>Glaçons</span></li>
          </ul>
        </div>
        <img :src="quests.src" :width="quests.width" :height="quests.height" alt="" class="feature-image" loading="lazy" />
      </section>

      <section class="feature feature--reverse">
        <div class="feature-text">
          <h2 class="feature-title">Démasque Léopold</h2>
          <p>
            Derrière chaque arnaque se cache Léopold, un léopard de mer escroc qui change de déguisement : pêcheur,
            livreur, faux conseiller… Repère ses indices dans de vrais faux messages, et retire-lui son masque.
          </p>
        </div>
        <div class="feature-villain" aria-hidden="true">
          <img :src="disguised.src" alt="" loading="lazy" />
          <img :src="unmasked.src" alt="" loading="lazy" />
        </div>
      </section>

      <section class="closing">
        <h2 class="closing-title">Le meilleur antivirus, c’est toi.</h2>
        <RouterLink to="/bienvenue" class="button">C’est parti</RouterLink>
      </section>
    </main>

    <footer class="home-foot">
      <div class="home-foot-inner">
        <Logo class="foot-logo" />
        <nav class="foot-links" aria-label="Liens utiles">
          <RouterLink to="/aide">Aide</RouterLink>
          <RouterLink to="/credits">Crédits</RouterLink>
          <RouterLink to="/preferences">Préférences</RouterLink>
          <RouterLink to="/connexion">Se connecter</RouterLink>
        </nav>
        <p class="foot-note">Un projet d’apprentis de l’N7, pour apprendre à repérer les pièges en ligne.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-top {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--paper);
  border-bottom: 2px solid var(--rule);
}

.home-top-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 12px var(--gutter);
}

.home-logo:hover {
  text-decoration: none;
}

/* --- Le héros */

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  align-items: center;
  gap: 56px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 64px var(--gutter) 80px;
}

.hero-image {
  width: 100%;
}

.hero-text {
  display: grid;
  justify-items: center;
  gap: 16px;
  text-align: center;
}

.hero-title {
  font-size: clamp(1.7rem, 3.4vw, 2.3rem);
  color: var(--toque);
}

.hero-sub {
  color: var(--muted);
}

.hero-actions {
  display: grid;
  gap: 12px;
  width: min(340px, 100%);
  margin-top: 8px;
}

/* --- Les sections alternées */

.feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 56px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 64px var(--gutter);
  border-top: 2px solid var(--rule);
}

.feature--reverse .feature-text {
  order: 2;
}

.feature-text {
  display: grid;
  gap: 14px;
}

.feature-title {
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  color: var(--beak);
}

.feature-text p {
  font-size: 1.1rem;
  color: var(--muted);
}

.feature-image {
  justify-self: center;
  width: auto;
  max-height: 340px;
}

.feature-stages {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}

.feature-stages img:nth-child(1) {
  width: 18%;
}

.feature-stages img:nth-child(2) {
  width: 22%;
}

.feature-stages img:nth-child(3) {
  width: 26%;
}

.feature-stages img:nth-child(4) {
  width: 34%;
}

.feature-items {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 0;
  list-style: none;
}

.feature-items li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--toque);
}

.feature-villain {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 24px;
}

.feature-villain img {
  width: auto;
  height: 300px;
}

.closing {
  display: grid;
  justify-items: center;
  gap: 20px;
  padding: 72px var(--gutter);
  text-align: center;
  background: var(--toque-pale);
}

.closing-title {
  font-size: clamp(1.7rem, 3.6vw, 2.4rem);
  color: var(--toque);
}

/* --- Le bas de page */

.home-foot {
  color: #dfe3ff;
  background: var(--toque);
}

.home-foot-inner {
  display: grid;
  justify-items: center;
  gap: 18px;
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 40px var(--gutter);
  text-align: center;
}

.foot-logo {
  color: #fff;
}

.foot-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 28px;
}

.foot-links a {
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #fff;
}

.foot-note {
  font-size: 0.9rem;
  color: #b9c1f2;
}

@media (max-width: 760px) {
  .hero,
  .feature {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .hero {
    padding-top: 32px;
    padding-bottom: 48px;
  }

  .hero-image {
    width: min(420px, 100%);
    justify-self: center;
  }

  .feature {
    padding-block: 48px;
    text-align: center;
  }

  .feature--reverse .feature-text {
    order: 0;
  }

  .feature-items {
    justify-content: center;
  }

  .feature-image {
    max-height: 240px;
  }

  .feature-villain img {
    height: 200px;
  }
}
</style>
