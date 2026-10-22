<script setup>
// La coque des écrans de l'appli : la barre de navigation à gauche (en bas sur téléphone), la
// colonne principale, et à droite les compteurs du joueur et des cartes d'appoint (quêtes,
// classement, profil à créer). Une page peut remplacer ces cartes par les siennes (slot aside).
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
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

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
  <div class="shell">
    <nav class="sidebar" aria-label="Navigation principale">
      <RouterLink to="/apprendre" class="sidebar-logo">
        <Logo class="logo-full" />
        <Logo class="logo-head" variant="head" />
      </RouterLink>
      <ul class="nav-list">
        <li v-for="item in NAV_ITEMS" :key="item.to">
          <RouterLink :to="item.to" class="nav-link" :class="{ 'is-active': isActive(item, route) }" :aria-current="isActive(item, route) ? 'page' : undefined">
            <img v-if="item.icon === 'tux'" :src="tux.src" alt="" class="nav-tux" />
            <Icon v-else :name="item.icon" :size="34" />
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </li>
        <li ref="more" class="nav-more">
          <button type="button" class="nav-link" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
            <span class="more-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="nav-label">Plus</span>
          </button>
          <div v-if="moreOpen" class="more-menu">
            <RouterLink v-for="item in moreItems" :key="item.to" :to="item.to" class="more-link" @click="moreOpen = false">{{ item.label }}</RouterLink>
            <button v-if="session.user" type="button" class="more-link" @click="signOut">Se déconnecter</button>
            <RouterLink v-else to="/connexion" class="more-link" @click="moreOpen = false">Se connecter</RouterLink>
          </div>
        </li>
      </ul>
    </nav>

    <header class="topbar">
      <StatsBar />
    </header>

    <div class="shell-body" :class="`shell-body--${width}`">
      <main id="contenu" class="shell-main" tabindex="-1">
        <slot />
      </main>
      <aside class="shell-aside">
        <div class="aside-sticky">
          <StatsBar />
          <slot v-if="slots.aside" name="aside" />
          <AsideCards v-else />
          <nav class="aside-links" aria-label="Liens utiles">
            <RouterLink to="/aide">Aide</RouterLink>
            <RouterLink to="/credits">Crédits</RouterLink>
            <RouterLink to="/preferences">Préférences</RouterLink>
            <RouterLink to="/">Accueil</RouterLink>
          </nav>
        </div>
      </aside>
    </div>

    <nav class="tabbar" aria-label="Navigation principale">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="tab"
        :class="{ 'is-active': isActive(item, route) }"
        :aria-current="isActive(item, route) ? 'page' : undefined"
      >
        <img v-if="item.icon === 'tux'" :src="tux.src" alt="" class="nav-tux" />
        <Icon v-else :name="item.icon" :size="34" />
        <span class="visually-hidden">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

/* --- La barre de gauche */

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: var(--sidebar);
  padding: 24px 16px;
  background: var(--paper);
  border-right: 2px solid var(--rule);
}

.sidebar-logo {
  display: block;
  padding: 0 12px 26px;
  text-decoration: none;
}

.logo-head {
  display: none;
}

.nav-list {
  display: grid;
  gap: 8px;
  padding: 0;
  list-style: none;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  min-height: 52px;
  padding: 6px 16px;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
  background: none;
  border: 2px solid transparent;
  border-radius: var(--radius-small);
}

.nav-link:hover {
  text-decoration: none;
  background: var(--wash);
}

.nav-link.is-active {
  color: var(--toque-bright);
  background: var(--toque-pale);
  border-color: var(--toque-line);
}

.nav-tux {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.more-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 34px;
  height: 34px;
  background: var(--toque-bright);
  border-radius: 50%;
}

.more-dots i {
  width: 5px;
  height: 5px;
  background: #fff;
  border-radius: 50%;
}

.nav-more {
  position: relative;
}

.more-menu {
  position: absolute;
  left: calc(100% - 8px);
  bottom: 0;
  z-index: 40;
  display: grid;
  min-width: 220px;
  padding: 8px 0;
  background: var(--paper);
  border: 2px solid var(--rule);
  border-radius: var(--radius);
  box-shadow: 0 10px 24px rgba(29, 34, 51, 0.12);
}

.more-link {
  padding: 12px 20px;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
  background: none;
  border: 0;
}

.more-link:hover {
  text-decoration: none;
  background: var(--wash);
  color: var(--ink);
}

/* --- Le corps : colonne principale et colonne de droite */

.shell-body {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-left: var(--sidebar);
  padding: 24px 24px 48px;
}

.shell-main {
  flex: 0 1 600px;
  min-width: 0;
}

.shell-body--wide .shell-main {
  flex-basis: 640px;
}

.shell-aside {
  flex: 0 0 var(--aside);
}

.aside-sticky {
  position: sticky;
  top: 24px;
  display: grid;
  gap: 24px;
}

.aside-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 20px;
  padding: 0 12px;
}

.aside-links a {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9aa0b4;
}

.topbar,
.tabbar {
  display: none;
}

/* Tablette : la barre de gauche ne garde que les illustrations ; plus de colonne de droite. */
@media (max-width: 1159px) {
  .shell-aside {
    display: none;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 15;
    display: block;
    margin-left: var(--sidebar);
    padding: 6px 16px;
    background: var(--paper);
    border-bottom: 2px solid var(--rule);
  }

  .topbar :deep(.stats) {
    max-width: 600px;
    margin-inline: auto;
  }
}

@media (max-width: 1159px) and (min-width: 700px) {
  .sidebar {
    width: 88px;
    padding-inline: 12px;
  }

  .logo-full,
  .nav-label {
    display: none;
  }

  .logo-head {
    display: inline-flex;
  }

  .sidebar-logo {
    padding-inline: 8px;
  }

  .nav-link {
    justify-content: center;
    padding-inline: 0;
  }

  .shell-body,
  .topbar {
    margin-left: 88px;
  }
}

/* Téléphone : compteurs en haut, onglets en bas. */
@media (max-width: 699px) {
  .sidebar {
    display: none;
  }

  .topbar,
  .shell-body {
    margin-left: 0;
  }

  .shell-body {
    padding: 16px 16px calc(var(--tabbar-height) + 32px);
  }

  .tabbar {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 20;
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: var(--tabbar-height);
    padding: 0 8px env(safe-area-inset-bottom);
    background: var(--paper);
    border-top: 2px solid var(--rule);
  }

  .tab {
    display: grid;
    place-items: center;
    width: 56px;
    height: 52px;
    border: 2px solid transparent;
    border-radius: var(--radius-small);
  }

  .tab.is-active {
    background: var(--toque-pale);
    border-color: var(--toque-line);
  }
}
</style>
