<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCardsStore } from '../stores/cards'
import { GRADES } from '../services/models'
import GradeBadge from '../components/GradeBadge.vue'

const props = defineProps({ id: { type: String, required: true } })
const store = useCardsStore()
const router = useRouter()

const category = computed(() => store.categoryById(props.id))
const counts = computed(() => store.gradeCounts(props.id))
const selected = ref(new Set(GRADES.filter((g) => counts.value[g] > 0)))

function toggle(grade) {
  if (counts.value[grade] === 0) return
  if (selected.value.has(grade)) selected.value.delete(grade)
  else selected.value.add(grade)
  // force reactivity
  selected.value = new Set(selected.value)
}

const availableCount = computed(() =>
  [...selected.value].reduce((sum, g) => sum + counts.value[g], 0)
)

const requestedCount = ref(15)

function startQuiz() {
  const grades = [...selected.value]
  if (grades.length === 0 || availableCount.value === 0) return
  router.push({
    name: 'quiz',
    params: { id: props.id },
    query: { grades: grades.join(','), count: String(Math.min(requestedCount.value, availableCount.value)) },
  })
}
</script>

<template>
  <div v-if="category">
    <header class="page-header">
      <div class="page-header-row">
        <button class="icon-btn" @click="router.back()" aria-label="Назад">←</button>
        <h1 class="page-title">Настройка квиза</h1>
      </div>
    </header>

    <div class="container">
      <p class="section-label">Какие карточки включить</p>
      <div class="grade-grid">
        <button
          v-for="g in GRADES"
          :key="g"
          class="grade-chip"
          :class="{ active: selected.has(g), disabled: counts[g] === 0 }"
          @click="toggle(g)"
        >
          <GradeBadge :grade="g" size="sm" />
          <span class="grade-count">{{ counts[g] }}</span>
        </button>
      </div>

      <div class="form-field count-field">
        <label>Количество карточек в квизе (доступно: {{ availableCount }})</label>
        <input
          type="number"
          min="1"
          :max="Math.max(availableCount, 1)"
          v-model.number="requestedCount"
        />
      </div>

      <button class="btn btn-primary btn-block" :disabled="availableCount === 0" @click="startQuiz">
        ▶ Начать ({{ Math.min(requestedCount, availableCount) || 0 }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin: 4px 0 10px;
}
.grade-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.grade-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--surface);
  cursor: pointer;
  opacity: 0.45;
}
.grade-chip.active {
  border-color: var(--accent);
  opacity: 1;
}
.grade-chip.disabled {
  opacity: 0.2;
  cursor: not-allowed;
}
.grade-count {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}
.count-field input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 11px 13px;
  font-size: 15px;
  background: var(--bg);
  color: var(--text);
}
</style>
