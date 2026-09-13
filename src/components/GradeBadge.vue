<script setup>
defineProps({
  grade: { type: String, required: true },
  size: { type: String, default: 'md' }, // 'sm' | 'md'
})
</script>

<template>
  <span class="grade-badge" :class="[`grade-${grade.toLowerCase()}`, size]">{{ grade }}</span>
</template>

<style scoped>
.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border-radius: 8px;
  color: white;
  line-height: 1;
}

.grade-badge.md {
  min-width: 30px;
  height: 26px;
  padding: 0 6px;
  font-size: 13px;
}

.grade-badge.sm {
  min-width: 22px;
  height: 20px;
  padding: 0 4px;
  font-size: 11px;
}

.grade-new {
  background: var(--grade-new);
}
.grade-f {
  background: var(--grade-f);
}
.grade-e {
  background: var(--grade-e);
}
.grade-d {
  background: var(--grade-d);
  color: #4a3b00;
}
.grade-c {
  background: var(--grade-c);
  color: #3c4a00;
}
.grade-b {
  background: var(--grade-b);
}
.grade-a {
  background: var(--grade-a);
}
</style>
