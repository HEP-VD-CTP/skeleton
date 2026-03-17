<template>
  <q-page padding>
    <div class="home-container">

      <!-- Welcome header -->
      <div class="welcome-section">
        <div class="welcome-avatar avatar--blue">
          {{ store.user?.firstname?.[0] }}{{ store.user?.lastname?.[0] }}
        </div>
        <div>
          <div class="welcome-greeting">{{ $t('home.welcome') }} {{ store.getTitle() }}</div>
          <div class="welcome-meta">{{ store.user?.firstname }} {{ store.user?.lastname }} &mdash; {{ store.getOrganization() }}</div>
        </div>
      </div>

      <!-- Files section -->
      <div class="files-section">
        <div class="section-header">
          <div class="section-title">{{ $t('home.my_files') }}</div>
          <q-btn round flat icon="add" color="primary" size="md" :loading="uploading" @click="triggerUpload">
            <q-tooltip>{{ $t('home.upload') }}</q-tooltip>
          </q-btn>
          <input ref="fileInput" type="file" hidden @change="onFileSelected" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="empty-state">
          <q-spinner-dots size="32px" color="grey-5" />
        </div>

        <!-- File list -->
        <div v-else-if="files.length > 0" class="file-list">
          <div v-for="file in files" :key="file.id" class="file-card">
            <div class="file-icon-wrap">
              <q-icon :name="fileIcon(file.mime_type)" size="24px" color="grey-6" />
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.filename || file.id }}</div>
              <div class="file-meta">{{ formatSize(file.size) }} &middot; {{ formatDate(file.created_at) }}</div>
            </div>
            <div class="file-actions">
              <q-btn flat round dense icon="download" size="sm" color="grey-7" @click="downloadFile(file.id, file.filename)">
                <q-tooltip>{{ $t('home.download') }}</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="delete_outline" size="sm" color="grey-7" @click="deleteFile(file.id)">
                <q-tooltip>{{ $t('misc.delete') }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="empty-state">
          <q-icon name="cloud_off" size="48px" color="grey-4" />
          <p class="empty-text">{{ $t('home.no_files') }}</p>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Store } from 'stores/Store'
import { orpc } from '../lib/orpc.ts'
import type { File } from '@Stendhal/lib/src/db/types'

const q = useQuasar()
const store = Store()
const { t } = useI18n()

const files: Ref<File[]> = ref([])
const loading: Ref<boolean> = ref(true)
const uploading: Ref<boolean> = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString()
}

function fileIcon(mimeType: string | null): string {
  if (!mimeType) return 'insert_drive_file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'movie'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'folder_zip'
  if (mimeType.includes('text') || mimeType.includes('document')) return 'description'
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return 'table_chart'
  if (mimeType.includes('presentation')) return 'slideshow'
  return 'insert_drive_file'
}

function downloadFile(fileId: string, filename: string | null): void {
  const link = document.createElement('a')
  link.href = `https://${store.getDomain()}/api/files/${fileId}`
  link.download = filename || fileId
  link.click()
}

async function deleteFile(fileId: string): Promise<void> {
  q.dialog({
    title: t('misc.delete'),
    message: t('home.delete_confirm'),
    cancel: { label: t('misc.cancel'), flat: true },
    persistent: true,
  }).onOk(async () => {
    try {
      await orpc.file.remove({ fileId })
      files.value = files.value.filter(f => f.id !== fileId)
    } catch (err) {
      q.notify({ type: 'negative', message: t('misc.error_message') })
      console.error(err)
    }
  })
}

function triggerUpload(): void {
  fileInput.value?.click()
}

async function onFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    await fetch(`https://${store.getDomain()}/api/files`, {
      method: 'POST',
      headers: { 'X-Filename': encodeURIComponent(file.name) },
      body: file,
      credentials: 'include',
    })
    files.value = await orpc.file.list({ userId: store.user!.id })
  } catch (err) {
    q.notify({ type: 'negative', message: t('misc.error_message') })
    console.error(err)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

onMounted(async () => {
  try {
    files.value = await orpc.file.list({ userId: store.user!.id })
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.home-container {
  max-width: 720px;
  margin: 0 auto;
}

// Welcome
.welcome-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 32px 0 40px;
}

.welcome-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  text-transform: uppercase;
}

.avatar--blue { background: #007aff; }

.welcome-greeting {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.welcome-meta {
  font-size: 14px;
  color: #8e8e93;
  margin-top: 2px;
}

// Files
.files-section {
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8e8e93;
  flex: 1;
  padding-left: 16px;
}

.file-list {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  overflow: hidden;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.file-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 1px;
}

.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.file-card:hover .file-actions {
  opacity: 1;
}

// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-text {
  font-size: 14px;
  color: #8e8e93;
  margin-top: 12px;
}

// Dark mode
.body--dark {
  .file-list {
    background: rgba(255, 255, 255, 0.06);
  }
  .file-card:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
  .file-card + .file-card {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .file-icon-wrap {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
