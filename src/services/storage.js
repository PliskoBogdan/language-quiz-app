// Persistence layer.
//
// Three storage backends, picked automatically at startup:
//
// 1. Native (iOS/Android via Capacitor): a real JSON file in the app's
//    sandboxed Documents directory, via @capacitor/filesystem. No dialogs,
//    no permissions to ask for - the app already owns that folder outright.
// 2. File System Access API (Chrome/Edge on desktop): the user picks or
//    creates a real .json file on disk once; after that the app reads/
//    writes it directly. Only the file *handle* (a permission token, not
//    the data) is cached in IndexedDB so the app can reconnect next time -
//    see fileHandleStore.js.
// 3. IndexedDB fallback (Safari/Firefox on desktop): the whole state as one
//    JSON blob in the browser's database. Functionally equivalent, just not
//    a file the user can see/move themselves.
//
// Whichever backend is active, Settings also offers a manual "export/
// import .json" backup (exportStateToFile/readStateFromFile below) - useful
// as an extra copy you can move to iCloud Drive/Google Drive by hand.

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { getSavedHandle, saveHandle, clearSavedHandle } from './fileHandleStore'

const IDB_KEY = 'english-cards:v1'
const FILE_NAME = 'cards-data.json'

function isNative() {
  return Capacitor.isNativePlatform()
}

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
let mode = 'idb' // 'native' | 'file' | 'idb'
let activeHandle = null // connected FileSystemFileHandle, once permission is granted
let pendingHandle = null // handle awaiting a user gesture to (re)grant permission

async function readNativeState() {
  try {
    const { data: text } = await Filesystem.readFile({
      path: FILE_NAME,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    return normalize(JSON.parse(text))
  } catch {
    // File doesn't exist yet (first launch) - create it.
    const data = emptyState()
    await writeNativeState(data)
    return data
  }
}

async function writeNativeState(state) {
  await Filesystem.writeFile({
    path: FILE_NAME,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    data: JSON.stringify(toPayload(state), null, 2),
  })
}

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
  if (isNative()) {
    mode = 'native'
    return { status: 'ready', mode: 'native', data: await readNativeState() }
  }

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
  if (mode === 'native') return FILE_NAME
  return activeHandle?.name || null
}

export async function saveState(state) {
  try {
    if (mode === 'native') {
      await writeNativeState(state)
    } else if (mode === 'file' && activeHandle) {
      await writeFileHandle(activeHandle, state)
    } else {
      await saveIdbState(state)
    }
  } catch (err) {
    console.error('Failed to save state', err)
  }
}

// ---- manual backup helpers (available regardless of storage mode) ----

export async function exportStateToFile(state) {
  const stamp = new Date().toISOString().slice(0, 10)
  const fileName = `cards-backup-${stamp}.json`
  const json = JSON.stringify(toPayload(state), null, 2)

  if (isNative()) {
    // No filesystem "Save As" dialog on iOS/Android - write the backup to
    // a temp spot and hand it to the native share sheet (AirDrop, Files,
    // Mail, etc.) so the user can put it wherever they like.
    await Filesystem.writeFile({
      path: fileName,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      data: json,
    })
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache })
    await Share.share({ title: fileName, url: uri })
    return
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
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
