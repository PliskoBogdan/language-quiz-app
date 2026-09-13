// Data model helpers + grading logic shared across the app.

export const GRADES = ['NEW', 'F', 'E', 'D', 'C', 'B', 'A']

// Letters reachable by review history, ordered worst -> best.
const SCALE = ['F', 'E', 'D', 'C', 'B', 'A']

// Points a quiz answer contributes to the running average that decides
// a card's letter grade. Higher = better recall.
export const ANSWER_POINTS = {
  again: 0, // "не помню" -> F
  hard: 2, // "с трудом"  -> D
  good: 3, // "нормально" -> C
  easy: 5, // "легко"    -> A
}

export const ANSWER_LABELS = [
  { key: 'again', label: 'Не помню' },
  { key: 'hard', label: 'Трудно' },
  { key: 'good', label: 'Хорошо' },
  { key: 'easy', label: 'Легко' },
]

// Only the most recent answers influence the grade, so it can keep
// improving or slipping instead of being stuck by very old history.
const RECENT_WINDOW = 8

// The card only remembers its last 20 answers - older ones are dropped.
const MAX_HISTORY = 20

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createCategory(name) {
  return {
    id: uid(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
}

export function createCard({ categoryId, front, backText = '', backImage = null }) {
  return {
    id: uid(),
    categoryId,
    front: front.trim(),
    back: {
      text: backText ? backText.trim() : '',
      image: backImage || null,
    },
    grade: 'NEW',
    history: [],
    createdAt: new Date().toISOString(),
  }
}

export function computeGrade(history) {
  if (!history || history.length === 0) return 'NEW'
  const recent = history.slice(-RECENT_WINDOW)
  const avg = recent.reduce((sum, h) => sum + h.points, 0) / recent.length
  const idx = Math.max(0, Math.min(SCALE.length - 1, Math.round(avg)))
  return SCALE[idx]
}

export function applyAnswer(card, answerKey) {
  const points = ANSWER_POINTS[answerKey]
  const history = [...card.history, { points, at: new Date().toISOString() }].slice(-MAX_HISTORY)
  return {
    ...card,
    history,
    grade: computeGrade(history),
  }
}
