<script setup>
// La coque des écrans de l'appli, reprise de la copie de référence : la barre de navigation à
// gauche (en bas sur téléphone), la colonne principale, et à droite les compteurs du joueur et
// des cartes d'appoint. Une page peut remplacer ces cartes par les siennes (slot aside).
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Logo from './Logo.vue'
import Icon from './Icon.vue'
import StatsBar from './StatsBar.vue'
import AsideCards from './AsideCards.vue'
import { NAV_ITEMS, MORE_ITEMS, isActive } from '../../lib/navigation.js'
import { session, logout } from '../../lib/session.js'
import { inventory } from '../../lib/inventory.js'
import { stageImage } from '../../lib/images.js'
import { showFlash } from '../../lib/flash.js'

defineProps({
  // Largeur de la colonne principale : « path » (le chemin), « wide » (tableaux), « text ».
  width: { type: String, default: 'path' },
})

const route = useRoute()
const router = useRouter()
const slots = useSlots()

const tux = computed(() => stageImage(inventory.data?.stage.level ?? 0, { mini: true }))
const moreOpen = ref(false)
const more = ref(null)
const moreItems = computed(() => MORE_ITEMS.filter((item) => !item.account || session.user))

function onDocumentClick(event) {
  if (more.value && !more.value.contains(event.target)) moreOpen.value = false
}
function onKey(event) {
  if (event.key === 'Escape') moreOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})

async function signOut() {
  moreOpen.value = false
  try {
    await logout()
    showFlash('Tu es déconnecté. À demain pour la mission du jour !')
    router.push('/')
  } catch {
    showFlash('Le serveur ne répond pas : réessaie dans un instant.')
  }
}
</script>

<template>
  <div class="cl-app cl-dashboard" :class="`cl-width-${width}`">
    <nav class="cl-sidebar" aria-label="Navigation principale">
      <RouterLink to="/apprendre" class="cl-brand">
        <Logo class="cl-full-brand" />
        <Logo class="cl-mini-brand" variant="head" />
      </RouterLink>
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="cl-nav-item"
        :class="{ active: isActive(item, route) }"
        :aria-current="isActive(item, route) ? 'page' : undefined"
      >
        <img v-if="item.icon === 'tux'" :src="tux.src" alt="" />
        <Icon v-else :name="item.icon" :size="32" />
        <span>{{ item.label }}</span>
      </RouterLink>
      <div ref="more" class="cl-more-wrap">
        <button type="button" class="cl-nav-item cl-more" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          <span class="cl-more-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>Plus</span>
        </button>
        <div v-if="moreOpen" class="cl-more-menu cl-popover">
          <RouterLink v-for="item in moreItems" :key="item.to" :to="item.to" @click="moreOpen = false">{{ item.label }}</RouterLink>
          <button v-if="session.user" type="button" @click="signOut">Se déconnecter</button>
          <RouterLink v-else to="/connexion" @click="moreOpen = false">Se connecter</RouterLink>
          <RouterLink to="/" @click="moreOpen = false">Accueil</RouterLink>
        </div>
      </div>
    </nav>

    <div class="cl-dashboard-grid">
      <aside class="cl-right-column">
        <StatsBar />
        <div class="cl-aside-panels">
          <slot v-if="slots.aside" name="aside" />
          <AsideCards v-else />
          <footer class="cl-small-footer">
            <RouterLink to="/aide">Aide</RouterLink>
            <RouterLink to="/credits">Crédits</RouterLink>
            <RouterLink to="/preferences">Préférences</RouterLink>
            <RouterLink to="/">Accueil</RouterLink>
          </footer>
        </div>
      </aside>
      <main id="contenu" class="cl-main-column" tabindex="-1">
        <slot />
        <!-- Sur téléphone et tablette, les cartes de droite et leur pied sont masqués : ces liens les remplacent. -->
        <footer class="cl-small-footer cl-main-footer">
          <RouterLink v-for="item in moreItems" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
          <RouterLink v-if="!session.user" to="/connexion">Se connecter</RouterLink>
          <RouterLink to="/">Accueil</RouterLink>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Le logo remplace l'image de la copie : grand dans la barre large, la tête seule sinon. */
.cl-brand :deep(.logo-name) {
  font-size: 1.75rem;
}

.cl-mini-brand {
  display: none;
}

.cl-nav-item img {
  object-fit: contain;
}

.cl-more-wrap {
  position: relative;
}

.cl-more-dots {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 32px;
  height: 32px;
  background: var(--toque-bright);
  border-radius: 50%;
}

.cl-more-dots i {
  width: 5px;
  height: 5px;
  background: #fff;
  border-radius: 50%;
}

.cl-width-wide .cl-dashboard-grid {
  grid-template-columns: minmax(0, 1fr) 368px;
  max-width: 1160px;
}

.cl-main-column:focus {
  outline: none;
}

/* Sur grand écran, les compteurs et les cartes restent en vue quand le chemin défile. */
.cl-right-column {
  position: sticky;
  top: 24px;
  align-self: start;
}

.cl-main-footer {
  display: none;
}

@media (max-width: 1079px) {
  .cl-right-column {
    position: static;
    align-self: stretch;
  }

  .cl-app .cl-main-footer {
    display: flex;
    margin-top: 40px;
  }
}

@media (max-width: 1199px) {
  .cl-full-brand {
    display: none;
  }

  .cl-mini-brand {
    display: inline-flex;
  }
}

@media (max-width: 699px) {
  .cl-right-column {
    position: sticky;
    top: 0;
  }

  .cl-more-wrap {
    display: none;
  }

  .cl-width-wide .cl-dashboard-grid {
    margin-inline: 16px;
  }
}
</style>
