<script setup>
import GradeBadge from './GradeBadge.vue'

defineProps({
  card: { type: Object, required: true },
})
defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="card-row card-surface" @click="$emit('edit')">
    <img v-if="card.back.image" :src="card.back.image" class="thumb" alt="" />
    <div v-else class="thumb thumb-placeholder">🖼️</div>

    <div class="card-texts">
      <div class="card-front">{{ card.front }}</div>
      <div class="card-back">{{ card.back.text || '—' }}</div>
    </div>

    <GradeBadge :grade="card.grade" />

    <button class="delete-btn" aria-label="Удалить" @click.stop="$emit('delete')">✕</button>
  </div>
</template>

<style scoped>
.card-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
  cursor: pointer;
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--bg);
}
.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  opacity: 0.4;
}
.card-texts {
  flex: 1;
  min-width: 0;
}
.card-front {
  font-weight: 600;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-back {
  font-size: 13px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.delete-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  flex-shrink: 0;
}
</style>
