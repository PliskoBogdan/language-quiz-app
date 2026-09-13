<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCardsStore } from '../stores/cards'
import * as storage from '../services/storage'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useCardsStore()
const router = useRouter()
const fileInput = ref(null)
const pendingFile = ref(null)
const status = ref('')
const switching = ref(false)
const switchError = ref('')

const storageMode = ref(storage.getMode())
const connectedFileName = ref(storage.getConnectedFileName())

function exportBackup() {
  store.exportBackup()
  status.value = 'Файл резервной копии сохранён.'
}

function pickImportFile() {
  fileInput.value.click()
}

function onFileChosen(e) {
  const file = e.target.files?.[0]
  if (!file) return
  pendingFile.value = file
  e.target.value = ''
}

async function confirmImport() {
  try {
    await store.importBackup(pendingFile.value)
    status.value = 'Данные успешно восстановлены.'
  } catch (err) {
    status.value = 'Не удалось прочитать файл: ' + err.message
  } finally {
    pendingFile.value = null
  }
}

async function switchFile(action) {
  switching.value = true
  switchError.value = ''
  try {
    await storage.disconnectFile()
    const { data, fileName } = await action()
    store.hydrate(data)
    storageMode.value = storage.getMode()
    connectedFileName.value = fileName
    status.value = 'Хранилище переключено на файл «' + fileName + '».'
  } catch (err) {
    if (err?.name !== 'AbortError') {
      switchError.value = err?.message || 'Не удалось подключить файл'
    }
  } finally {
    switching.value = false
  }
}

const switchToNewFile = () => switchFile(storage.createNewFile)
const switchToExistingFile = () => switchFile(storage.openExistingFile)
</script>

<template>
  <div>
    <header class="page-header">
      <div class="page-header-row">
        <button class="icon-btn" @click="router.back()" aria-label="Назад">←</button>
        <h1 class="page-title">Настройки</h1>
      </div>
    </header>

    <div class="container">
      <div class="card-surface section">
        <h3>Хранилище данных</h3>

        <template v-if="storageMode === 'file'">
          <p class="hint-text">
            Данные хранятся в файле «{{ connectedFileName }}» на этом компьютере и сохраняются в
            него сразу при любом изменении.
          </p>
          <button class="btn btn-block" :disabled="switching" @click="switchToNewFile">
            📄 Создать новый файл
          </button>
          <button class="btn btn-block" :disabled="switching" @click="switchToExistingFile">
            📂 Открыть другой файл
          </button>
        </template>

        <template v-else>
          <p class="hint-text">
            Ваш браузер не поддерживает прямую работу с файлами на диске (это доступно в Chrome и
            Edge), поэтому данные хранятся во внутренней базе браузера. Используйте экспорт ниже,
            чтобы получить настоящий JSON-файл с копией данных.
          </p>
        </template>

        <p v-if="switchError" class="status-text error">{{ switchError }}</p>
      </div>

      <div class="card-surface section">
        <h3>Резервная копия</h3>
        <p class="hint-text">
          Если приложение когда-нибудь будет удалено (особенно на телефоне), данные исчезнут вместе
          с ним — это ограничение самой платформы. Регулярно сохраняйте JSON-копию — её можно
          положить в iCloud Drive / Google Drive и восстановить после переустановки.
        </p>
        <button class="btn btn-primary btn-block" @click="exportBackup">⬇️ Экспортировать данные (.json)</button>
        <button class="btn btn-block" @click="pickImportFile">⬆️ Импортировать из файла</button>
        <input ref="fileInput" type="file" accept="application/json" class="hidden-input" @change="onFileChosen" />
        <p v-if="status" class="status-text">{{ status }}</p>
      </div>

      <div class="card-surface section">
        <h3>О приложении</h3>
        <p class="hint-text">
          Категорий: {{ store.categories.length }} · Карточек: {{ store.cards.length }}
        </p>
      </div>
    </div>

    <ConfirmDialog
      v-if="pendingFile"
      title="Заменить все данные?"
      message="Импорт полностью заменит текущие категории и карточки содержимым файла. Это необратимо."
      confirm-label="Импортировать"
      @confirm="confirmImport"
      @cancel="pendingFile = null"
    />
  </div>
</template>

<style scoped>
.section {
  padding: 18px;
  margin-bottom: 16px;
}
.section h3 {
  margin: 0 0 10px;
}
.hint-text {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 14px;
}
.section .btn {
  margin-bottom: 10px;
}
.hidden-input {
  display: none;
}
.status-text {
  font-size: 13px;
  color: var(--accent-dark);
  margin: 6px 0 0;
}
.status-text.error {
  color: var(--danger);
}
</style>
