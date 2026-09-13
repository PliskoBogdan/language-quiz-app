<script setup>
import { ref } from 'vue'

defineProps({
  front: { type: String, required: true },
  back: { type: Object, required: true }, // { text, image }
  flipped: { type: Boolean, required: true },
})
const emit = defineEmits(['toggle'])

const zoomOpen = ref(false)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)

let startDist = 0
let startScale = 1
let startTx = 0
let startTy = 0
let startX = 0
let startY = 0
let panning = false
let lastTapTime = 0
let lastTapX = 0
let lastTapY = 0

function openZoom() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
  zoomOpen.value = true
}
function closeZoom() {
  zoomOpen.value = false
}

function distance(touches) {
  const [a, b] = touches
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function clampTranslate() {
  const maxOffset = 150 * (scale.value - 1) + 40
  tx.value = Math.min(maxOffset, Math.max(-maxOffset, tx.value))
  ty.value = Math.min(maxOffset, Math.max(-maxOffset, ty.value))
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    panning = false
    startDist = distance(e.touches)
    startScale = scale.value
  } else if (e.touches.length === 1) {
    panning = true
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    startTx = tx.value
    startTy = ty.value
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2) {
    e.preventDefault()
    const dist = distance(e.touches)
    scale.value = Math.min(4, Math.max(1, startScale * (dist / startDist)))
    clampTranslate()
  } else if (e.touches.length === 1 && panning) {
    e.preventDefault()
    tx.value = startTx + (e.touches[0].clientX - startX)
    ty.value = startTy + (e.touches[0].clientY - startY)
  }
}

function onTouchEnd(e) {
  panning = false
  if (scale.value <= 1) {
    scale.value = 1
    tx.value = 0
    ty.value = 0
  } else {
    clampTranslate()
  }

  if (e.changedTouches?.length === 1 && e.touches.length === 0) {
    const t = e.changedTouches[0]
    const now = Date.now()
    const isDoubleTap =
      now - lastTapTime < 300 && Math.abs(t.clientX - lastTapX) < 30 && Math.abs(t.clientY - lastTapY) < 30
    if (isDoubleTap) {
      lastTapTime = 0
      if (scale.value > 1) {
        scale.value = 1
        tx.value = 0
        ty.value = 0
      } else {
        scale.value = 2.5
      }
    } else {
      lastTapTime = now
      lastTapX = t.clientX
      lastTapY = t.clientY
    }
  }
}
</script>

<template>
  <div class="flip-card" @click="emit('toggle')">
    <div class="flip-card-inner" :class="{ flipped }">
      <div class="flip-face flip-front">
        <span class="front-text">{{ front }}</span>
        <span class="hint">нажмите, чтобы перевернуть</span>
      </div>
      <div class="flip-face flip-back" :class="{ 'has-image': back.image }">
        <img
          v-if="back.image"
          :src="back.image"
          class="back-image"
          alt=""
          @click.stop="openZoom"
        />
        <span v-if="back.text" class="back-text">{{ back.text }}</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="zoomOpen" class="zoom-overlay" @click.self="closeZoom">
        <button class="zoom-close" aria-label="Закрыть" @click="closeZoom">✕</button>
        <img
          :src="back.image"
          class="zoom-image"
          :style="{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        />
      </div>
    </Teleport>
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
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.flip-front {
  background: var(--surface);
}
.flip-back {
  background: var(--accent);
  color: white;
  transform: rotateY(180deg);
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
/* Image first, text below - both flow normally so long text can scroll. */
.flip-back.has-image {
  padding: 0;
  justify-content: flex-start;
}
.back-image {
  width: 100%;
  height: 170px;
  flex-shrink: 0;
  object-fit: cover;
  cursor: zoom-in;
}
.has-image .back-text {
  padding: 16px 20px 20px;
}

.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}
.zoom-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  touch-action: none;
  will-change: transform;
}
.zoom-close {
  position: absolute;
  top: calc(16px + var(--safe-top));
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 18px;
  cursor: pointer;
  z-index: 1;
}
</style>
