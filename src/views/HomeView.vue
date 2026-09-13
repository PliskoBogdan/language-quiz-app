<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCardsStore } from '../stores/cards'
import CategoryCard from '../components/CategoryCard.vue'
import PromptModal from '../components/PromptModal.vue'

const store = useCardsStore()
const router = useRouter()
const showAddModal = ref(false)

function openCategory(id) {
  router.push({ name: 'category', params: { id } })
}

async function createCategory(name) {
  const category = await store.addCategory(name)
  showAddModal.value = false
  openCategory(category.id)
}
</script>

<template>
  <div>
    <header class="page-header">
      <div class="page-header-row">
        <h1 class="page-title">Категории</h1>
        <button class="icon-btn" @click="router.push({ name: 'settings' })" aria-label="Настройки">⚙️</button>
        <button class="icon-btn" @click="showAddModal = true" aria-label="Добавить категорию">＋</button>
      </div>
    </header>

    <div class="container">
      <div v-if="store.categories.length === 0" class="empty-state">
        Пока нет ни одной категории.<br />
        Нажмите «＋», чтобы создать первую.
      </div>

      <div v-else class="category-grid">
        <CategoryCard
          v-for="cat in store.categories"
          :key="cat.id"
          :name="cat.name"
          :count="store.cardCountByCategory(cat.id)"
          @click="openCategory(cat.id)"
        />
      </div>
    </div>

    <PromptModal
      v-if="showAddModal"
      title="Новая категория"
      label="Название категории"
      confirm-label="Создать"
      @confirm="createCategory"
      @cancel="showAddModal = false"
    />
  </div>
</template>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
</style>
