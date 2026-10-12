import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Les appels à /api partent vers le back-end Express (port 4000 par défaut).
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
