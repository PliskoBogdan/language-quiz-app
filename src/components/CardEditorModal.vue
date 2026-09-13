<script setup>
import { ref, computed } from 'vue'
import { fileToCompressedDataUrl } from '../services/image'
import FlipCard from './FlipCard.vue'

const props = defineProps({
  card: { type: Object, default: null }, // null = creating a new card
})
const emit = defineEmits(['save', 'cancel'])

const front = ref(props.card?.front || '')
const backText = ref(props.card?.back?.text || '')
const backImage = ref(props.card?.back?.image || null)
const imageBusy = ref(false)
const fileInput = ref(null)
const showPreview = ref(false)
const previewFlipped = ref(false)

const previewBack = computed(() => ({ text: backText.value, image: backImage.value }))
const canPreview = computed(() => front.value.trim() && (backText.value.trim() || backImage.value))

function openPreview() {
  previewFlipped.value = false
  showPreview.value = true
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  imageBusy.value = true
  try {
    backImage.value = await fileToCompressedDataUrl(file)
  } finally {
    imageBusy.value = false
    e.target.value = ''
  }
}

function removeImage() {
  backImage.value = null
}

function submit() {
  if (!front.value.trim()) return
  emit('save', {
    front: front.value,
    backText: backText.value,
    backImage: backImage.value,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div v-if="showPreview" class="modal-sheet">
      <h3 class="editor-title">Превью карточки</h3>

      <FlipCard
        :front="front"
        :back="previewBack"
        :flipped="previewFlipped"
        @toggle="previewFlipped = !previewFlipped"
      />

      <div class="editor-actions">
        <button class="btn btn-block" @click="showPreview = false">← Назад к редактированию</button>
      </div>
    </div>

    <div v-else class="modal-sheet">
      <h3 class="editor-title">{{ card ? 'Редактировать карточку' : 'Новая карточка' }}</h3>

      <div class="form-field">
        <label>Слово / фраза (лицевая сторона)</label>
        <input v-model="front" type="text" placeholder="например, apple" autofocus />
      </div>

      <div class="form-field">
        <label>Перевод текстом (необязательно, если есть фото)</label>
        <textarea v-model="backText" rows="2" placeholder="например, яблоко"></textarea>
      </div>

      <div class="form-field">
        <label>Перевод картинкой (необязательно)</label>
        <div v-if="backImage" class="image-preview-wrap">
          <img :src="backImage" class="image-preview" alt="" />
          <button class="btn btn-danger remove-image-btn" @click="removeImage">Удалить фото</button>
        </div>
        <button v-else class="btn btn-block" :disabled="imageBusy" @click="fileInput.click()">
          {{ imageBusy ? 'Обработка…' : '📷 Добавить фото' }}
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="onFileChange"
        />
      </div>

      <div class="editor-actions">
        <button class="btn" @click="emit('cancel')">Отмена</button>
        <button class="btn" :disabled="!canPreview" @click="openPreview">👁 Превью</button>
        <button
          class="btn btn-primary"
          :disabled="!front.trim() || (!backText.trim() && !backImage)"
          @click="submit"
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-title {
  margin: 4px 0 16px;
  font-size: 18px;
}
.hidden-input {
  display: none;
}
.image-preview-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.image-preview {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  object-fit: cover;
}
.remove-image-btn {
  flex: 1;
}
.editor-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}
.editor-actions .btn {
  flex: 1;
}
</style>
