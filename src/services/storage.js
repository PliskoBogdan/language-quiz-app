// Persistence layer.
//
// Primary storage: a real JSON file on disk, via the File System Access
// API (Chrome/Edge - showSaveFilePicker/showOpenFilePicker). The user picks
// or creates the file once; after that the app reads/writes it directly, no
// dialogs. Only the file *handle* (a small permission token, not the data)
// is cached in IndexedDB so the app can reconnect on the next visit -
// see fileHandleStore.js.
//
// Fallback storage: browsers without the API (Safari, Firefox) get the
// whole state stored as one JSON blob in IndexedDB instead. Functionally
// equivalent, just not a file the user can see/move themselves.
//
// Either way, Settings also offers a manual "download/upload .json" backup
// (exportStateToFile/readStateFromFile below) - useful as an extra copy
// regardless of which primary mode is active.
//
// MOBILE NOTE: once this app is wrapped with Capacitor for iOS/Android,
// swap this module for one backed by @capacitor/filesystem (Documents
// directory) - that's a real JSON file with no picker/permission dance,
// since the app owns its sandbox outright.

import { get as idbGet, set as idbSet } from 'idb-keyval'
import { getSavedHandle, saveHandle, clearSavedHandle } from './fileHandleStore'

const IDB_KEY = 'english-cards:v1'
const FILE_NAME = 'cards-data.json'

export const emptyState = () => ({ categories: [], cards: [] })

function toPayload(state) {
  return JSON.parse(
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: state.categories,
      cards: state.cards,
    })
  )
}

function normalize(data) {
  if (!data || typeof data !== 'object') return emptyState()
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
    cards: Array.isArray(data.cards) ? data.cards : [],
  }
}

export function isFileSystemSupported() {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function'
}

// ---- module-level (non-reactive) connection state ----
let mode = 'idb' // 'file' | 'idb'
let activeHandle = null // connected FileSystemFileHandle, once permission is granted
let pendingHandle = null // handle awaiting a user gesture to (re)grant permission

async function readFileHandle(handle) {
  const file = await handle.getFile()
  const text = await file.text()
  if (!text.trim()) return emptyState()
  return normalize(JSON.parse(text))
}

async function writeFileHandle(handle, state) {
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(toPayload(state), null, 2))
  await writable.close()
}

async function loadIdbState() {
  const data = await idbGet(IDB_KEY)
  return normalize(data)
}

async function saveIdbState(state) {
  await idbSet(IDB_KEY, toPayload(state))
}

// Figures out what the UI should show on startup: either we're ready to
// go (file connected + permission already granted, or using the IndexedDB
// fallback), or the user needs to take an action first.
export async function detectStorage() {
  if (!isFileSystemSupported()) {
    mode = 'idb'
    return { status: 'ready', mode: 'idb', data: await loadIdbState() }
  }

  let handle
  try {
    handle = await getSavedHandle()
  } catch (err) {
    console.error('Failed to read saved file handle', err)
  }

  if (!handle) {
    return { status: 'need-setup', mode: 'file' }
  }

  try {
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    if (permission === 'granted') {
      mode = 'file'
      activeHandle = handle
      return { status: 'ready', mode: 'file', data: await readFileHandle(handle), fileName: handle.name }
    }
    if (permission === 'prompt') {
      pendingHandle = handle
      return { status: 'need-permission', mode: 'file', fileName: handle.name }
    }
    // 'denied' - the browser won't ask again for this handle, start fresh
    await clearSavedHandle()
    return { status: 'need-setup', mode: 'file' }
  } catch (err) {
    console.error('Saved file handle is no longer usable', err)
    await clearSavedHandle()
    return { status: 'need-setup', mode: 'file' }
  }
}

export async function grantPermission() {
  if (!pendingHandle) throw new Error('Нет файла, ожидающего разрешения')
  const permission = await pendingHandle.requestPermission({ mode: 'readwrite' })
  if (permission !== 'granted') {
    throw new Error('Доступ к файлу не предоставлен')
  }
  mode = 'file'
  activeHandle = pendingHandle
  const data = await readFileHandle(activeHandle)
  const fileName = activeHandle.name
  pendingHandle = null
  return { data, fileName }
}

export async function createNewFile() {
  const handle = await window.showSaveFilePicker({
    suggestedName: FILE_NAME,
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  })
  const data = emptyState()
  await writeFileHandle(handle, data)
  await saveHandle(handle)
  mode = 'file'
  activeHandle = handle
  pendingHandle = null
  return { data, fileName: handle.name }
}

export async function openExistingFile() {
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  })
  const data = await readFileHandle(handle)
  await saveHandle(handle)
  mode = 'file'
  activeHandle = handle
  pendingHandle = null
  return { data, fileName: handle.name }
}

export async function disconnectFile() {
  await clearSavedHandle()
  activeHandle = null
  pendingHandle = null
}

export function getMode() {
  return mode
}

export function getConnectedFileName() {
  return activeHandle?.name || null
}

export async function saveState(state) {
  try {
    if (mode === 'file' && activeHandle) {
      await writeFileHandle(activeHandle, state)
    } else {
      await saveIdbState(state)
    }
  } catch (err) {
    console.error('Failed to save state', err)
  }
}

// ---- manual backup helpers (available regardless of storage mode) ----

export function exportStateToFile(state) {
  const blob = new Blob([JSON.stringify(toPayload(state), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `cards-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function readStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.categories) || !Array.isArray(data.cards)) {
          throw new Error('Файл повреждён или имеет неверный формат')
        }
        resolve(normalize(data))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
