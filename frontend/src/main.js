import { createApp } from 'vue'
import '@fontsource-variable/nunito'
import './styles/base.css'
import './styles/app.css'
import App from './App.vue'
import router from './router'
import { applyPreferences } from './lib/preferences.js'

applyPreferences()

createApp(App).use(router).mount('#app')
