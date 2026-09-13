import { defineStore } from 'pinia'
import { GRADES, createCategory, createCard, applyAnswer } from '../services/models'
import { saveState, emptyState, exportStateToFile, readStateFromFile } from '../services/storage'

export const useCardsStore = defineStore('cards', {
  state: () => ({
    ...emptyState(),
    ready: false,
  }),

  getters: {
    categoryById: (state) => (id) => state.categories.find((c) => c.id === id),

    cardsByCategory: (state) => (categoryId) =>
      state.cards.filter((c) => c.categoryId === categoryId),

    cardCountByCategory: (state) => (categoryId) =>
      state.cards.filter((c) => c.categoryId === categoryId).length,

    gradeCounts: (state) => (categoryId) => {
      const counts = Object.fromEntries(GRADES.map((g) => [g, 0]))
      for (const card of state.cards) {
        if (card.categoryId === categoryId) counts[card.grade]++
      }
      return counts
    },
  },

  actions: {
    // Called by StorageGate once it knows where the data is coming from
    // (a connected JSON file or the IndexedDB fallback) and has loaded it.
    hydrate(data) {
      this.categories = data.categories
      this.cards = data.cards
      this.ready = true
    },

    async persist() {
      await saveState({ categories: this.categories, cards: this.cards })
    },

    async addCategory(name) {
      const category = createCategory(name)
      this.categories.push(category)
      await this.persist()
      return category
    },

    async renameCategory(id, name) {
      const category = this.categoryById(id)
      if (!category) return
      category.name = name.trim()
      await this.persist()
    },

    async deleteCategory(id) {
      this.categories = this.categories.filter((c) => c.id !== id)
      this.cards = this.cards.filter((c) => c.categoryId !== id)
      await this.persist()
    },

    async addCard({ categoryId, front, backText, backImage }) {
      const card = createCard({ categoryId, front, backText, backImage })
      this.cards.push(card)
      await this.persist()
      return card
    },

    async updateCard(id, patch) {
      const card = this.cards.find((c) => c.id === id)
      if (!card) return
      if (patch.front !== undefined) card.front = patch.front.trim()
      if (patch.backText !== undefined) card.back.text = patch.backText.trim()
      if (patch.backImage !== undefined) card.back.image = patch.backImage
      await this.persist()
    },

    async deleteCard(id) {
      this.cards = this.cards.filter((c) => c.id !== id)
      await this.persist()
    },

    async answerCard(id, answerKey) {
      const idx = this.cards.findIndex((c) => c.id === id)
      if (idx === -1) return
      this.cards[idx] = applyAnswer(this.cards[idx], answerKey)
      await this.persist()
    },

    async exportBackup() {
      await exportStateToFile({ categories: this.categories, cards: this.cards })
    },

    async importBackup(file) {
      const data = await readStateFromFile(file)
      this.categories = data.categories
      this.cards = data.cards
      await this.persist()
    },
  },
})
