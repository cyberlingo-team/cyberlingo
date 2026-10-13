import { createApp } from 'vue'
import '@fontsource-variable/anybody/standard.css'
import '@fontsource-variable/playpen-sans'
import './styles/base.css'
import App from './App.vue'
import router from './router'
import { applyPreferences } from './lib/preferences.js'

applyPreferences()

createApp(App).use(router).mount('#app')
