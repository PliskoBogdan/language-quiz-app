// Persists the *handle* (a small permission token), not the actual data,
// so the app can reconnect to the same on-disk JSON file across reloads
// without asking the user to pick it again every time (permission still
// has to be re-confirmed by the browser in some cases - see storage.js).

import { get, set, del, createStore } from 'idb-keyval'

const metaStore = createStore('english-cards-meta', 'handles')
const HANDLE_KEY = 'data-file-handle'

export function getSavedHandle() {
  return get(HANDLE_KEY, metaStore)
}

export function saveHandle(handle) {
  return set(HANDLE_KEY, handle, metaStore)
}

export function clearSavedHandle() {
  return del(HANDLE_KEY, metaStore)
}
