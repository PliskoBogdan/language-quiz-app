<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardsStore } from '../stores/cards'
import { ANSWER_LABELS } from '../services/models'
import FlipCard from '../components/FlipCard.vue'

const props = defineProps({ id: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const store = useCardsStore()

const category = computed(() => store.categoryById(props.id))

const queue = ref([])
const currentIndex = ref(0)
const flipped = ref(false)
const finished = ref(false)
const answerCounts = ref({ again: 0, hard: 0, good: 0, easy: 0 })

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQueue() {
  const grades = (route.query.grades || '').split(',').filter(Boolean)
  const count = Number(route.query.count) || 15
  const pool = store.cardsByCategory(props.id).filter((c) => grades.includes(c.grade))
  queue.value = shuffle(pool)
    .slice(0, count)
    .map((c) => c.id)
  currentIndex.value = 0
  flipped.value = false
  finished.value = false
  answerCounts.value = { again: 0, hard: 0, good: 0, easy: 0 }
}

onMounted(buildQueue)

const currentCard = computed(() => {
  const id = queue.value[currentIndex.value]
  return id ? store.cards.find((c) => c.id === id) : null
})

const progressLabel = computed(() => `${Math.min(currentIndex.value + 1, queue.value.length)} / ${queue.value.length}`)

async function answer(key) {
  if (!currentCard.value) return
  answerCounts.value[key]++
  await store.answerCard(currentCard.value.id, key)
  setTimeout(() => {
    if (currentIndex.value + 1 >= queue.value.length) {
      finished.value = true
    } else {
      currentIndex.value++
    }
  }, 150)
}

watch(currentIndex, () => {
  flipped.value = false
})

function restart() {
  buildQueue()
}

function backToCategory() {
  router.push({ name: 'category', params: { id: props.id } })
}
</script>

<template>
  <div v-if="category">
    <header class="page-header">
      <div class="page-header-row">
        <button class="icon-btn" @click="backToCategory" aria-label="Закрыть">✕</button>
        <h1 class="page-title">{{ category.name }}</h1>
        <span v-if="!finished" class="progress">{{ progressLabel }}</span>
      </div>
    </header>

    <div class="container">
      <div v-if="queue.length === 0 && !finished" class="empty-state">Нет карточек для квиза.</div>

      <template v-else-if="!finished">
        <transition name="slide" mode="out-in">
          <FlipCard
            v-if="currentCard"
            :key="currentCard.id"
            :front="currentCard.front"
            :back="currentCard.back"
            :flipped="flipped"
            @toggle="flipped = !flipped"
          />
        </transition>

        <transition name="fade">
          <div v-if="flipped" class="answer-row">
            <button
              v-for="a in ANSWER_LABELS"
              :key="a.key"
              class="answer-btn"
              :class="`answer-${a.key}`"
              @click="answer(a.key)"
            >
              {{ a.label }}
            </button>
          </div>
        </transition>
      </template>

      <div v-else class="summary card-surface">
        <h2>Готово! 🎉</h2>
        <p class="summary-sub">Вы прошли {{ queue.length }} карточек</p>
        <div class="summary-grid">
          <div v-for="a in ANSWER_LABELS" :key="a.key" class="summary-item">
            <div class="summary-count">{{ answerCounts[a.key] }}</div>
            <div class="summary-label">{{ a.label }}</div>
          </div>
        </div>
        <div class="summary-actions">
          <button class="btn btn-block" @click="restart">🔁 Повторить</button>
          <button class="btn btn-primary btn-block" @click="backToCategory">Готово</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    Категория не найдена.<br />
    <button class="btn btn-primary" style="margin-top: 14px" @click="router.push({ name: 'home' })">
      На главную
    </button>
  </div>
</template>

<style scoped>
.progress {
  font-size: 14px;
  color: var(--muted);
  font-weight: 600;
}
.answer-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
}
.answer-btn {
  border: none;
  border-radius: 14px;
  padding: 16px 10px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  color: white;
}
.answer-again {
  background: var(--grade-f);
}
.answer-hard {
  background: var(--grade-e);
}
.answer-good {
  background: var(--grade-b);
}
.answer-easy {
  background: var(--grade-a);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

.summary {
  padding: 28px 22px;
  text-align: center;
  margin-top: 20px;
}
.summary h2 {
  margin: 0 0 6px;
}
.summary-sub {
  color: var(--muted);
  margin: 0 0 20px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}
.summary-count {
  font-size: 22px;
  font-weight: 700;
}
.summary-label {
  font-size: 12px;
  color: var(--muted);
}
.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
