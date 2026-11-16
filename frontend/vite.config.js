import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Les appels à /api partent vers le back-end Express (port 4000 par défaut, API_URL pour
    // en changer). Ils n'y vont qu'en mode express (`npm run dev:express`) : sinon, l'interface
    // parle au serveur simulé et n'appelle jamais /api.
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:4000',
    },
  },
})
