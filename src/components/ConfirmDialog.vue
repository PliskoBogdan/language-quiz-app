<script setup>
defineProps({
  title: { type: String, default: 'Вы уверены?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Удалить' },
  danger: { type: Boolean, default: true },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('cancel')">
    <div class="modal-sheet confirm-sheet">
      <h3 class="confirm-title">{{ title }}</h3>
      <p v-if="message" class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn" @click="emit('cancel')">Отмена</button>
        <button class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-sheet {
  max-width: 380px;
}
.confirm-title {
  margin: 4px 0 8px;
  font-size: 18px;
}
.confirm-message {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 18px;
}
.confirm-actions {
  display: flex;
  gap: 10px;
}
.confirm-actions .btn {
  flex: 1;
}
</style>
