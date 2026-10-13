<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Wordmark from './tux/Wordmark.vue'
import MuscleName from './tux/MuscleName.vue'
import Picture from './comic/Picture.vue'
import { session } from '../lib/session.js'
import { stageImage } from '../lib/images.js'
import { formatNumber, plural } from '../lib/format.js'
import { NAV_ITEMS, isActive } from '../lib/navigation.js'
import logoHead from '../assets/brand/tux-prof-tete.svg'

const route = useRoute()
const user = computed(() => session.user)
const meLabel = computed(() => (user.value ? `Mon Tux : ${user.value.username}, ${user.value.stage.name}, ${plural(user.value.points, 'point')}` : ''))
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/" class="brand">
        <img :src="logoHead" class="brand-logo" width="46" height="46" alt="" />
        <Wordmark />
      </RouterLink>

      <nav class="nav" aria-label="Navigation principale">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'is-active': isActive(item, route) }"
          :aria-current="isActive(item, route) ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="who">
        <RouterLink v-if="user" to="/mon-tux" class="me" :aria-label="meLabel">
          <Picture class="me-tux" :image="stageImage(user.stage.level, { mini: true })" alt="" eager />
          <span class="me-text" aria-hidden="true">
            <MuscleName class="me-name" :name="user.username" :level="user.stage.level" :wrap="false" />
            <span class="me-points">{{ formatNumber(user.points) }} pts</span>
          </span>
        </RouterLink>
        <template v-else-if="session.status !== 'loading'">
          <RouterLink to="/connexion" class="login-link">Se connecter</RouterLink>
          <RouterLink to="/inscription" class="button button--small signup-link">Créer mon compte</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--paper);
  border-bottom: var(--line) solid var(--ink);
}

.header-inner {
  width: min(100% - 2 * var(--gutter), 1120px);
  min-height: var(--header-height);
  margin-inline: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo {
  width: 42px;
  height: 42px;
  margin-block: -2px;
}

.nav {
  display: flex;
  gap: 4px;
  margin-inline: auto;
}

.nav-link {
  padding: 6px 12px;
  font-family: var(--font-title);
  font-weight: 650;
  font-size: 1.02rem;
  color: var(--ink);
  text-decoration: none;
  border: 2px solid transparent;
}

.nav-link:hover {
  border-color: var(--ink);
}

.nav-link.is-active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--caption);
  font-weight: 800;
}

.who {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
  min-width: 0;
}

.nav + .who {
  margin-left: 0;
}

.login-link {
  font-weight: 600;
  white-space: nowrap;
}

.me {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 3px 10px 3px 4px;
  color: var(--ink);
  text-decoration: none;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.me:hover {
  background: var(--caption-pale);
}

.me-tux {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.me-text {
  display: grid;
  min-width: 0;
  line-height: 1.1;
}

.me-name {
  max-width: 10em;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: normal;
}

.me-points {
  font-size: 0.85rem;
  color: var(--muted);
  white-space: nowrap;
}

@media (max-width: 859px) {
  .nav,
  .signup-link {
    display: none;
  }

  .header-inner {
    gap: 10px;
  }

  .me-name {
    max-width: 6.5em;
  }
}

@media (max-width: 380px) {
  .brand-logo {
    width: 36px;
    height: 36px;
  }

  .brand :deep(.wordmark) {
    font-size: 1.3rem;
  }

  .me-name {
    display: none;
  }
}
</style>
