<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCardsStore } from '../stores/cards'
import CardListItem from '../components/CardListItem.vue'
import CardEditorModal from '../components/CardEditorModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PromptModal from '../components/PromptModal.vue'

const props = defineProps({ id: { type: String, required: true } })
const store = useCardsStore()
const router = useRouter()

const category = computed(() => store.categoryById(props.id))
const cards = computed(() =>
  store.cardsByCategory(props.id).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
)

const showEditor = ref(false)
const editingCard = ref(null)
const deletingCardId = ref(null)
const showRenameModal = ref(false)
const showDeleteCategory = ref(false)

function openNewCard() {
  editingCard.value = null
  showEditor.value = true
}
function openEditCard(card) {
  editingCard.value = card
  showEditor.value = true
}
async function saveCard(payload) {
  if (editingCard.value) {
    await store.updateCard(editingCard.value.id, payload)
  } else {
    await store.addCard({ categoryId: props.id, ...payload })
  }
  showEditor.value = false
}
async function confirmDeleteCard() {
  await store.deleteCard(deletingCardId.value)
  deletingCardId.value = null
}
async function renameCategory(name) {
  await store.renameCategory(props.id, name)
  showRenameModal.value = false
}
async function deleteCategory() {
  await store.deleteCategory(props.id)
  router.push({ name: 'home' })
}
</script>

<template>
  <div v-if="category">
    <header class="page-header">
      <div class="page-header-row">
        <button class="icon-btn" @click="router.push({ name: 'home' })" aria-label="Назад">←</button>
        <h1 class="page-title" @click="showRenameModal = true">{{ category.name }}</h1>
        <button class="icon-btn" @click="showDeleteCategory = true" aria-label="Удалить категорию">🗑️</button>
        <button class="icon-btn" @click="openNewCard" aria-label="Добавить карточку">＋</button>
      </div>
    </header>

    <div class="container">
      <button
        class="btn btn-primary btn-block quiz-btn"
        :disabled="cards.length === 0"
        @click="router.push({ name: 'quiz-setup', params: { id: props.id } })"
      >
        ▶ Начать квиз
      </button>

      <div v-if="cards.length === 0" class="empty-state">
        В этой категории пока нет карточек.
      </div>

      <div v-else>
        <CardListItem
          v-for="card in cards"
          :key="card.id"
          :card="card"
          @edit="openEditCard(card)"
          @delete="deletingCardId = card.id"
        />
      </div>
    </div>

    <CardEditorModal
      v-if="showEditor"
      :card="editingCard"
      @save="saveCard"
      @cancel="showEditor = false"
    />

    <ConfirmDialog
      v-if="deletingCardId"
      title="Удалить карточку?"
      message="Это действие нельзя отменить."
      @confirm="confirmDeleteCard"
      @cancel="deletingCardId = null"
    />

    <PromptModal
      v-if="showRenameModal"
      title="Переименовать категорию"
      label="Название"
      :initial-value="category.name"
      confirm-label="Сохранить"
      @confirm="renameCategory"
      @cancel="showRenameModal = false"
    />

    <ConfirmDialog
      v-if="showDeleteCategory"
      title="Удалить категорию?"
      message="Все карточки внутри также будут удалены безвозвратно."
      @confirm="deleteCategory"
      @cancel="showDeleteCategory = false"
    />
  </div>

  <div v-else class="empty-state">
    Категория не найдена.<br />
    <button class="btn btn-primary" style="margin-top: 14px" @click="router.push({ name: 'home' })">
      На главную
    </button>
  </div>
</template>

<style scoped>
.quiz-btn {
  margin-bottom: 16px;
}
</style>
