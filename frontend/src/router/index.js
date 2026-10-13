// Les adresses du site, en français. Chaque écran est chargé à la demande.

import { createRouter, createWebHistory } from 'vue-router'
import { loadSession, session } from '../lib/session.js'
import { todayIso } from '../lib/format.js'

const routes = [
  { path: '/', name: 'today', component: () => import('../views/TodayView.vue'), meta: { title: 'L’épisode du jour' } },
  {
    path: '/episode/:date',
    name: 'episode',
    component: () => import('../views/EpisodeView.vue'),
    meta: { title: 'Épisode' },
    // L'épisode du jour a sa propre page : celle d'accueil.
    beforeEnter: (to) => (to.params.date === todayIso() ? { name: 'today' } : true),
  },
  { path: '/episodes', name: 'episodes', component: () => import('../views/EpisodesView.vue'), meta: { title: 'Les épisodes' } },
  { path: '/classement', name: 'leaderboard', component: () => import('../views/LeaderboardView.vue'), meta: { title: 'Classement' } },
  { path: '/mon-tux', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: 'Mon Tux' } },
  {
    path: '/mon-compte',
    name: 'account',
    component: () => import('../views/AccountView.vue'),
    meta: { title: 'Mon compte', requiresAccount: true },
  },
  { path: '/la-bande', name: 'gang', component: () => import('../views/GangView.vue'), meta: { title: 'La bande à Tux' } },
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
    meta: { title: 'Créer mon compte', guestOnly: true },
  },
  { path: '/credits', name: 'credits', component: () => import('../views/CreditsView.vue'), meta: { title: 'Crédits' } },
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
  if (to.meta.guestOnly && session.user) return { name: 'profile' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} – CyberLingo` : 'CyberLingo'
})

export default router
