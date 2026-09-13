<script setup>
import { useCardsStore } from './stores/cards'
import StorageGate from './components/StorageGate.vue'

const store = useCardsStore()
</script>

<template>
  <StorageGate>
    <router-view v-if="store.ready" v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </StorageGate>
</template>
