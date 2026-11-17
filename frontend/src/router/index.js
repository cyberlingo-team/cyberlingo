// Les adresses du site, en français. Chaque écran est chargé à la demande.

import { createRouter, createWebHistory } from 'vue-router'
import { loadSession, session } from '../lib/session.js'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Apprends à déjouer les arnaques en ligne' },
    // Un joueur connecté va directement à son chemin.
    beforeEnter: async () => {
      await loadSession()
      return session.user ? { name: 'learn' } : true
    },
  },
  {
    path: '/bienvenue',
    name: 'welcome',
    component: () => import('../views/WelcomeView.vue'),
    meta: { title: 'Bienvenue' },
  },
  {
    path: '/apprendre',
    name: 'learn',
    component: () => import('../views/LearnView.vue'),
    meta: { title: 'Apprendre' },
  },
  {
    path: '/apprendre/:unit/guide',
    name: 'guide',
    component: () => import('../views/GuideView.vue'),
    meta: { title: 'Guide du thème' },
  },
  {
    path: '/lecon/:id',
    name: 'lesson',
    component: () => import('../views/LessonView.vue'),
    meta: { title: 'Leçon' },
  },
  {
    path: '/mission-du-jour',
    name: 'daily',
    component: () => import('../views/LessonView.vue'),
    meta: { title: 'Mission du jour' },
  },
  {
    path: '/classement',
    name: 'leaderboard',
    component: () => import('../views/LeaderboardView.vue'),
    meta: { title: 'Classement' },
  },
  {
    path: '/quetes',
    name: 'quests',
    component: () => import('../views/QuestsView.vue'),
    meta: { title: 'Quêtes' },
  },
  {
    path: '/boutique',
    name: 'shop',
    component: () => import('../views/ShopView.vue'),
    meta: { title: 'Boutique' },
  },
  {
    path: '/mon-tux',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: 'Mon Tux' },
  },
  {
    path: '/succes',
    name: 'achievements',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: 'Succès' },
  },
  {
    path: '/preferences',
    name: 'preferences',
    component: () => import('../views/PreferencesView.vue'),
    meta: { title: 'Préférences' },
  },
  {
    path: '/mon-compte',
    name: 'account',
    component: () => import('../views/AccountView.vue'),
    meta: { title: 'Mon compte', requiresAccount: true },
  },
  {
    path: '/aide',
    name: 'help',
    component: () => import('../views/HelpView.vue'),
    meta: { title: 'Aide' },
  },
  {
    path: '/connexion',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Se connecter', guestOnly: true },
  },
  {
    path: '/inscription',
    name: 'signup',
    component: () => import('../views/SignupView.vue'),
    meta: { title: 'Créer un profil', guestOnly: true },
  },
  {
    path: '/credits',
    name: 'credits',
    component: () => import('../views/CreditsView.vue'),
    meta: { title: 'Crédits' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Page introuvable' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    // Changer d'onglet du classement ne fait pas remonter la page.
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

// Pages réservées : on demande d'abord au serveur qui est connecté.
router.beforeEach(async (to) => {
  if (!to.meta.requiresAccount && !to.meta.guestOnly) return true
  await loadSession()
  if (to.meta.requiresAccount && !session.user && session.status === 'ready') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && session.user) return { name: 'learn' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} – CyberLingo` : 'CyberLingo'
})

export default router
