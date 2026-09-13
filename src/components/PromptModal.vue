<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  label: { type: String, default: 'Название' },
  initialValue: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Сохранить' },
})
const emit = defineEmits(['confirm', 'cancel'])

const value = ref(props.initialValue)
const inputRef = ref(null)

function submit() {
  const trimmed = value.value.trim()
  if (!trimmed) return
  emit('confirm', trimmed)
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal-sheet prompt-sheet">
      <h3 class="prompt-title">{{ title }}</h3>
      <div class="form-field">
        <label>{{ label }}</label>
        <input
          ref="inputRef"
          v-model="value"
          type="text"
          autofocus
          @keyup.enter="submit"
        />
      </div>
      <div class="prompt-actions">
        <button class="btn" @click="emit('cancel')">Отмена</button>
        <button class="btn btn-primary" :disabled="!value.trim()" @click="submit">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prompt-sheet {
  max-width: 420px;
}
.prompt-title {
  margin: 4px 0 14px;
  font-size: 18px;
}
.prompt-actions {
  display: flex;
  gap: 10px;
}
.prompt-actions .btn {
  flex: 1;
}
</style>
