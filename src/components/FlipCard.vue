<script setup>
defineProps({
  front: { type: String, required: true },
  back: { type: Object, required: true }, // { text, image }
  flipped: { type: Boolean, required: true },
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <div class="flip-card" @click="emit('toggle')">
    <div class="flip-card-inner" :class="{ flipped }">
      <div class="flip-face flip-front">
        <span class="front-text">{{ front }}</span>
        <span class="hint">нажмите, чтобы перевернуть</span>
      </div>
      <div class="flip-face flip-back" :class="{ 'has-image': back.image }">
        <img v-if="back.image" :src="back.image" class="back-image" alt="" />
        <span v-if="back.text" class="back-text">{{ back.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flip-card {
  width: 100%;
  height: 320px;
  perspective: 1400px;
  cursor: pointer;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}
.flip-card-inner.flipped {
  transform: rotateY(180deg);
}
.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 18px rgba(30, 20, 60, 0.1);
}
.flip-front {
  background: var(--surface);
}
.flip-back {
  background: var(--accent);
  color: white;
  transform: rotateY(180deg);
  overflow: hidden;
}
.front-text {
  font-size: 30px;
  font-weight: 700;
  word-break: break-word;
}
.hint {
  font-size: 12px;
  color: var(--muted);
}
.back-text {
  font-size: 24px;
  font-weight: 700;
  word-break: break-word;
}
/* The image *is* the translation, not a separate thumbnail next to it -
   it fills the whole card regardless of its original size/aspect ratio. */
.flip-back.has-image {
  padding: 0;
}
.back-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.has-image .back-text {
  position: relative;
  z-index: 1;
  align-self: stretch;
  margin-top: auto;
  padding: 28px 20px 20px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0));
}
</style>
