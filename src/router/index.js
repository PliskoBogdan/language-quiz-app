import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CategoryView from '../views/CategoryView.vue'
import QuizSetupView from '../views/QuizSetupView.vue'
import QuizView from '../views/QuizView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  // Hash history avoids server-side routing config and plays nicely when
  // the build is later loaded from a `file://`-style origin inside a
  // Cordova/Capacitor WebView.
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/category/:id', name: 'category', component: CategoryView, props: true },
    { path: '/category/:id/quiz-setup', name: 'quiz-setup', component: QuizSetupView, props: true },
    { path: '/category/:id/quiz', name: 'quiz', component: QuizView, props: true },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
