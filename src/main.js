import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// A silent crash (blank white screen, no visible message) is the worst
// failure mode for a local-first app - show whatever broke instead.
function showFatalError(err) {
  console.error(err)
  const box = document.getElementById('fatal-error')
  const msg = document.getElementById('fatal-error-message')
  if (box && msg) {
    msg.textContent = err?.stack || err?.message || String(err)
    box.hidden = false
  }
}

window.addEventListener('error', (e) => showFatalError(e.error || e.message))
window.addEventListener('unhandledrejection', (e) => showFatalError(e.reason))

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => showFatalError(err instanceof Error ? err : new Error(`${err} (${info})`))

app.use(createPinia())
app.use(router)
app.mount('#app')
