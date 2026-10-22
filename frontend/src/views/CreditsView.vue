<script setup>
// Les crédits : qui a dessiné quoi, sous quelle licence, et ce que nous avons modifié. La page
// prend le cadre des réglages de la copie de référence : des sections sous des titres à filet.
import SettingsFrame from '../components/account/SettingsFrame.vue'
import { CREATED_IMAGES, FONTS, GANG_CREDITS, LICENSES, SOURCES, TEAM } from '../content/credits.js'
import { gangImage, stageImage } from '../lib/images.js'
import logo from '../assets/brand/tux-prof.svg'

// Une adresse longue se coupe après une barre oblique plutôt qu'au milieu d'un mot.
function slashParts(text) {
  return text.split(/(?<=\/)/)
}
</script>

<template>
  <SettingsFrame title="Crédits">
  <div class="credits">
    <p class="credits-lead">
      Tux, le manchot de Linux, a été dessiné par Larry Ewing en 1996. Tous les Tux de CyberLingo descendent du
      sien. Voici d’où vient chacun, et ce que nous avons changé.
    </p>

    <section class="credit-block" aria-labelledby="credits-logo">
      <img :src="logo" class="credit-logo" width="120" height="120" alt="" />
      <div class="credit-text">
        <h2 id="credits-logo">Le logo : Tux en professeur</h2>
        <p>
          D’après <strong>Tux</strong> de Larry Ewing (lewing@isc.tamu.edu), réalisé avec The GIMP. Usage libre avec
          cette mention. L’icône de l’onglet en est le recadrage sur la tête.
        </p>
      </div>
    </section>

    <section class="credit-block" aria-labelledby="credits-stages">
      <div class="credit-stages" aria-hidden="true">
        <img v-for="level in [0, 2, 4, 7]" :key="level" :src="stageImage(level, { mini: true }).src" alt="" />
      </div>
      <div class="credit-text">
        <h2 id="credits-stages">Les huit stades du Tux</h2>
        <p>
          Huit images générées pour CyberLingo avec Codex (OpenAI) à partir du logo, d’après <strong>Tux</strong> de
          Larry Ewing. Modifiées pour le site : fond blanc rendu transparent, marges recadrées, réduites et converties
          en WebP, avec une miniature pour chacune.
        </p>
      </div>
    </section>

    <section class="credit-section" aria-labelledby="credits-gang">
      <h2 id="credits-gang" class="credit-heading">La bande à Tux</h2>
      <p>
        Des Tux dessinés par d’autres, tous sous licence libre, issus de Wikimedia Commons. Chaque image garde la
        licence de son original.
      </p>
      <ul class="gang-list">
        <li v-for="item in GANG_CREDITS" :key="item.id" class="gang-item">
          <img class="gang-image" :src="gangImage(item.id).src" alt="" />
          <div class="gang-text">
            <p class="gang-title">« {{ item.title }} »</p>
            <p>
              <template v-for="(part, index) in slashParts(item.byline)" :key="index">{{ part }}<wbr /></template>
            </p>
            <p>
              Licence :
              <a v-if="LICENSES[item.license]" :href="LICENSES[item.license]" rel="license noopener" target="_blank">{{ item.license }}</a>
              <template v-else>{{ item.license }}</template>.
              <a :href="item.source" rel="noopener" target="_blank">Voir l’original</a>
            </p>
            <p class="gang-changes">{{ item.changes }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section class="credit-section" aria-labelledby="credits-created">
      <h2 id="credits-created" class="credit-heading">Créées pour CyberLingo</h2>
      <p>
        Trente-quatre images dessinées pour le site avec l’outil de génération d’images de Codex (OpenAI), dans le style du
        logo et d’après <strong>Tux</strong> de Larry Ewing, puis détourées, recadrées et converties en WebP :
      </p>
      <ul class="plain-list">
        <li v-for="line in CREATED_IMAGES" :key="line">{{ line }}.</li>
      </ul>
      <p>
        Léopold, le léopard de mer escroc, et tous les personnages des leçons sont inventés. Les bruitages sont
        synthétisés par le navigateur pendant le jeu : aucun son enregistré.
      </p>
    </section>

    <section class="credit-section" aria-labelledby="credits-fonts">
      <h2 id="credits-fonts" class="credit-heading">Polices</h2>
      <ul class="plain-list">
        <li v-for="font in FONTS" :key="font.name">
          <strong>{{ font.name }}</strong>, pour {{ font.use }}. {{ font.copyright }},
          <a :href="font.source" rel="noopener" target="_blank">{{ font.source.replace('https://', '') }}</a>, sous
          <a :href="LICENSES['SIL Open Font License 1.1']" rel="license noopener" target="_blank">SIL Open Font License 1.1</a>.
        </li>
      </ul>
      <p>
        Le site est construit avec Vue, vue-router et Vite, sous
        <a :href="LICENSES.MIT" rel="license noopener" target="_blank">licence MIT</a>.
      </p>
    </section>

    <section class="credit-section" aria-labelledby="credits-content">
      <h2 id="credits-content" class="credit-heading">Le contenu des leçons</h2>
      <p>
        Les conseils suivent les recommandations
        <template v-for="(source, index) in SOURCES" :key="source.name">
          {{ index === 0 ? '' : index === SOURCES.length - 1 ? ' et ' : ', ' }}{{ source.of }}<a :href="source.url" rel="noopener" target="_blank">{{ source.name }}</a>
        </template>.
        Chaque leçon cite ses sources à la fin. Les banques, boutiques, numéros, adresses et messages des leçons sont
        inventés : toute ressemblance avec une vraie arnaque est voulue, avec une vraie marque, non.
      </p>
    </section>

    <section class="credit-section" aria-labelledby="credits-privacy">
      <h2 id="credits-privacy" class="credit-heading">Tes données</h2>
      <p>
        CyberLingo garde ton pseudo, ton mot de passe haché et salé, tes réponses et tes points. Ni e-mail, ni nom, ni
        publicité, ni traceur. Le seul cookie est celui de ta session ; tes réglages de bruitages et d’animations
        restent dans ton navigateur. Tu peux supprimer ton compte à tout moment depuis la page
        <RouterLink to="/mon-compte">Mon compte</RouterLink>.
      </p>
    </section>

    <section class="credit-section" aria-labelledby="credits-team">
      <h2 id="credits-team" class="credit-heading">L’équipe</h2>
      <p>
        CyberLingo est un projet du cours Développement d’applications web et mobiles (N7, 2A FISA), par
        {{ TEAM.slice(0, -1).join(', ') }} et {{ TEAM.at(-1) }}.
      </p>
    </section>
  </div>
  </SettingsFrame>
</template>

<style scoped>
.credits {
  display: grid;
  gap: 8px;
  max-width: 900px;
  font-size: 17px;
  line-height: 1.5;
}

.credits-lead {
  margin-top: -32px;
  color: var(--muted);
}

.credits a {
  font-weight: 700;
  color: var(--toque-bright);
}

.credit-block {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 24px;
  align-items: center;
  margin-top: 24px;
}

.credit-logo {
  justify-self: center;
  width: 120px;
  height: auto;
}

.credit-stages {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
}

.credit-stages :deep(img) {
  width: 30px;
}

.credit-stages :deep(img:last-child) {
  width: 44px;
}

.credit-text {
  display: grid;
  gap: 6px;
}

/* Les deux blocs illustrés ont un titre de carte, pas le titre à filet des sections. */
.cl-app .credit-text h2 {
  margin: 0;
  padding: 0;
  font-size: 20px;
  color: var(--ink);
  border: 0;
}

.credit-section {
  display: grid;
  gap: 12px;
}

.credit-section p {
  color: var(--muted);
}

.gang-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
  gap: 12px;
}

.gang-item {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
  align-items: start;
  padding: 14px;
  font-size: 15px;
  line-height: 1.4;
  border: 2px solid var(--rule);
  border-radius: 16px;
}

.credit-section .gang-item p {
  color: var(--ink);
}

.gang-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.gang-text {
  display: grid;
  gap: 2px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.gang-title {
  font-weight: 800;
}

.credit-section .gang-changes {
  margin-top: 4px;
  color: var(--muted);
  font-size: 14px;
}

.plain-list {
  padding-left: 1.2em;
  display: grid;
  gap: 4px;
  color: var(--ink);
}

@media (max-width: 699px) {
  .credits {
    font-size: 16px;
  }

  .credits-lead {
    margin-top: -16px;
  }

  .credit-block {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .credit-logo,
  .credit-stages {
    justify-self: start;
  }

  .credit-logo {
    width: 88px;
  }
}
</style>
