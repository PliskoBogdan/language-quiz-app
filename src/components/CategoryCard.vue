<script setup>
defineProps({
  name: { type: String, required: true },
  count: { type: Number, required: true },
})
</script>

<template>
  <div class="category-card card-surface">
    <div class="category-name">{{ name }}</div>
    <div class="category-count">{{ count }} {{ count === 1 ? 'карточка' : 'карточек' }}</div>
  </div>
</template>

<style scoped>
.category-card {
  padding: 18px;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.category-card:active {
  transform: scale(0.98);
}
.category-name {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.category-count {
  font-size: 13px;
  color: var(--muted);
}
</style>
