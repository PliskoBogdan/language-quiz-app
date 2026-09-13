<script setup>
import { ref, onMounted } from 'vue'
import { useCardsStore } from '../stores/cards'
import * as storage from '../services/storage'

const store = useCardsStore()
const status = ref('checking') // checking | need-setup | need-permission | error
const fileName = ref('')
const errorMessage = ref('')
const busy = ref(false)

async function check() {
  status.value = 'checking'
  try {
    const result = await storage.detectStorage()
    if (result.status === 'ready') {
      store.hydrate(result.data)
      status.value = 'ready'
    } else {
      status.value = result.status
      fileName.value = result.fileName || ''
    }
  } catch (err) {
    console.error('Storage detection failed', err)
    errorMessage.value = err?.message || 'Не удалось проверить хранилище'
    status.value = 'need-setup'
  }
}

onMounted(check)

async function run(action) {
  busy.value = true
  errorMessage.value = ''
  try {
    const { data } = await action()
    store.hydrate(data)
    status.value = 'ready'
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error('Storage action failed', err)
      errorMessage.value = err?.message || 'Не удалось получить доступ к файлу'
    }
  } finally {
    busy.value = false
  }
}

const createNewFile = () => run(storage.createNewFile)
const openExistingFile = () => run(storage.openExistingFile)
const grantPermission = () => run(storage.grantPermission)

async function pickDifferentFile() {
  await storage.disconnectFile()
  status.value = 'need-setup'
  errorMessage.value = ''
}
</script>

<template>
  <div v-if="status === 'checking'" class="gate-screen">
    <p class="gate-hint">Загрузка…</p>
  </div>

  <div v-else-if="status === 'need-setup'" class="gate-screen">
    <div class="gate-card card-surface">
      <h1 class="gate-title">📁 Где хранить данные</h1>
      <p class="gate-text">
        Приложение хранит все карточки в одном JSON-файле прямо на вашем компьютере. Создайте новый
        файл или откройте уже существующий (например, из прошлой резервной копии).
      </p>
      <button class="btn btn-primary btn-block" :disabled="busy" @click="createNewFile">
        📄 Создать новый файл
      </button>
      <button class="btn btn-block" :disabled="busy" @click="openExistingFile">
        📂 Открыть существующий файл
      </button>
      <p v-if="errorMessage" class="gate-error">{{ errorMessage }}</p>
    </div>
  </div>

  <div v-else-if="status === 'need-permission'" class="gate-screen">
    <div class="gate-card card-surface">
      <h1 class="gate-title">🔒 Нужно подтвердить доступ</h1>
      <p class="gate-text">
        Браузер просит заново подтвердить доступ к файлу «{{ fileName }}», в котором лежат ваши
        карточки.
      </p>
      <button class="btn btn-primary btn-block" :disabled="busy" @click="grantPermission">
        Разрешить доступ
      </button>
      <button class="btn btn-block" :disabled="busy" @click="pickDifferentFile">
        Выбрать другой файл
      </button>
      <p v-if="errorMessage" class="gate-error">{{ errorMessage }}</p>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.gate-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px calc(16px + env(safe-area-inset-right)) 24px calc(16px + env(safe-area-inset-left));
}
.gate-card {
  max-width: 420px;
  width: 100%;
  padding: 26px 22px;
  text-align: center;
}
.gate-title {
  font-size: 20px;
  margin: 0 0 12px;
}
.gate-text {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
  margin: 0 0 20px;
}
.gate-card .btn {
  margin-bottom: 10px;
}
.gate-hint {
  color: var(--muted);
}
.gate-error {
  color: var(--danger);
  font-size: 13px;
  margin: 10px 0 0;
}
</style>
