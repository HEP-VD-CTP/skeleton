<template>
  <q-page padding>
    <div class="admin-container">

      <!-- Left panel -->
      <div class="left-panel">

        <!-- Search + Add button row -->
        <div class="search-row">
          <q-input
            v-model="searchQuery"
            :placeholder="$t('users.search_user')"
            rounded
            filled
            dense
            debounce="300"
            class="search-input"
            @update:model-value="onSearch"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="grey-6" />
            </template>
            <template v-slot:append>
              <q-icon v-if="searchQuery" name="close" class="cursor-pointer" color="grey-6" @click="searchQuery = ''; results = []" />
            </template>
          </q-input>
          <q-btn round flat icon="add" color="primary" size="md" @click="showAddDialog = true">
            <q-tooltip>{{ $t('users.add_user') }}</q-tooltip>
          </q-btn>
        </div>

        <!-- Loading -->
        <div v-if="searching" class="empty-state">
          <q-spinner-dots size="32px" color="grey-5" />
        </div>

        <!-- User list -->
        <div v-else-if="results.length > 0" class="user-list">
          <div
            v-for="user in results"
            :key="user.id"
            class="user-card"
            :class="{ 'user-card--active': selectedUser?.id === user.id }"
            @click="selectUser(user)"
          >
            <div class="user-avatar" :class="avatarColor(user)">
              {{ user.firstname[0] }}{{ user.lastname[0] }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.firstname }} {{ user.lastname }}</div>
              <div class="user-email">{{ user.email }}</div>
            </div>
            <div class="user-badges">
              <span v-if="user.admin" class="badge badge--red">Admin</span>
              <span v-if="user.teacher" class="badge badge--blue">Teacher</span>
              <span v-if="user.blocked" class="badge badge--orange">Blocked</span>
              <span v-if="user.archived" class="badge badge--grey">Archived</span>
            </div>
          </div>
        </div>

        <!-- Empty: no results -->
        <div v-else-if="searchQuery && !searching" class="empty-state">
          <q-icon name="person_off" size="48px" color="grey-4" />
          <p class="empty-text">{{ $t('users.no_results') }}</p>
        </div>

        <!-- Empty: instructions -->
        <div v-else class="empty-state">
          <q-icon name="search" size="48px" color="grey-4" />
          <p class="empty-text" v-html="$t('users.instructions')"></p>
        </div>
      </div>

      <!-- Right panel: detail -->
      <div class="right-panel">
        <template v-if="selectedUser">

          <!-- Header -->
          <div class="detail-header">
            <div class="detail-avatar" :class="avatarColor(selectedUser)">
              {{ selectedUser.firstname[0] }}{{ selectedUser.lastname[0] }}
            </div>
            <div>
              <div class="detail-name">{{ selectedUser.firstname }} {{ selectedUser.lastname }}</div>
              <div class="detail-meta">{{ $t('users.member_since') }} {{ new Date(selectedUser.created_at).toLocaleDateString() }}</div>
            </div>
            <div class="detail-status">
              <transition name="fade" mode="out-in">
                <span v-if="saving" key="saving" class="save-indicator saving">{{ $t('users.saving') }}</span>
                <span v-else-if="showSaved" key="saved" class="save-indicator saved">{{ $t('users.saved') }}</span>
              </transition>
            </div>
          </div>

          <!-- Identity section -->
          <div class="settings-section">
            <div class="section-title">{{ $t('users.identity') }}</div>
            <div class="settings-card">
              <div class="setting-row">
                <label class="setting-label">{{ $t('user.firstname') }}</label>
                <q-input v-model="editForm.firstname" borderless dense class="setting-input" />
              </div>
              <div class="setting-divider" />
              <div class="setting-row">
                <label class="setting-label">{{ $t('user.lastname') }}</label>
                <q-input v-model="editForm.lastname" borderless dense class="setting-input" />
              </div>
              <div class="setting-divider" />
              <div class="setting-row">
                <label class="setting-label">{{ $t('user.email') }}</label>
                <q-input v-model="editForm.email" borderless dense type="email" class="setting-input" />
              </div>
            </div>
          </div>

          <!-- Roles section -->
          <div class="settings-section">
            <div class="section-title">{{ $t('users.roles') }}</div>
            <div class="settings-card">
              <div class="setting-row">
                <div>
                  <div class="setting-label">{{ $t('users.teacher_role.title') }}</div>
                  <div class="setting-description">{{ $t('users.teacher_role.description') }}</div>
                </div>
                <q-toggle v-model="editForm.teacher" color="blue" />
              </div>
              <div class="setting-divider" />
              <div class="setting-row">
                <div>
                  <div class="setting-label">{{ $t('users.admin_role.title') }}</div>
                  <div class="setting-description">{{ $t('users.admin_role.description') }}</div>
                </div>
                <q-toggle v-model="editForm.admin" color="red" />
              </div>
            </div>
          </div>

          <!-- Status section -->
          <div class="settings-section">
            <div class="section-title">{{ $t('users.status') }}</div>
            <div class="settings-card">
              <div class="setting-row">
                <div>
                  <div class="setting-label">{{ $t('users.blocked_role.title') }}</div>
                  <div class="setting-description">{{ $t('users.blocked_role.description') }}</div>
                </div>
                <q-toggle v-model="editForm.blocked" color="orange" />
              </div>
              <div class="setting-divider" />
              <div class="setting-row">
                <div>
                  <div class="setting-label">{{ $t('users.archived_role.title') }}</div>
                  <div class="setting-description">{{ $t('users.archived_role.description') }}</div>
                </div>
                <q-toggle v-model="editForm.archived" color="grey" />
              </div>
            </div>
          </div>

          <!-- Disk usage section -->
          <div class="settings-section">
            <div class="section-title">{{ $t('users.disk_usage') }}</div>
            <div class="settings-card">
              <div class="setting-row">
                <div class="setting-label">{{ $t('users.files') }}</div>
                <span class="disk-value">{{ userFiles.length }}</span>
              </div>
              <div class="setting-divider" />
              <div class="setting-row">
                <div class="setting-label">{{ $t('users.total_size') }}</div>
                <span class="disk-value">{{ formatSize(totalSize()) }}</span>
              </div>
            </div>
          </div>

          <!-- Files section -->
          <div class="settings-section">
            <div class="section-title">{{ $t('users.files') }}</div>

            <div v-if="loadingFiles" class="empty-state" style="padding: 24px;">
              <q-spinner-dots size="24px" color="grey-5" />
            </div>

            <div v-else-if="userFiles.length > 0" class="file-list">
              <div v-for="file in userFiles" :key="file.id" class="file-card">
                <div class="file-icon-wrap">
                  <q-icon :name="fileIcon(file.mime_type)" size="20px" color="grey-6" />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ file.filename || file.id }}</div>
                  <div class="file-meta">{{ formatSize(file.size) }} &middot; {{ new Date(file.created_at).toLocaleDateString() }}</div>
                </div>
              </div>
            </div>

            <div v-else class="empty-state" style="padding: 24px;">
              <span class="empty-text">{{ $t('users.no_files') }}</span>
            </div>
          </div>

        </template>

        <!-- No user selected -->
        <div v-else class="empty-state">
          <q-icon name="person_search" size="64px" color="grey-4" />
          <p class="empty-text">{{ $t('users.use_filter') }}</p>
        </div>
      </div>
    </div>

    <!-- Add user dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card class="add-dialog">
        <q-card-section>
          <div class="text-h6" style="font-weight: 600;">{{ $t('users.add_user') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input v-model="addForm.firstname" :label="$t('user.firstname')" filled rounded dense />
          <q-input v-model="addForm.lastname" :label="$t('user.lastname')" filled rounded dense />
          <q-input v-model="addForm.email" :label="$t('user.email')" filled rounded dense type="email" />
          <q-input v-model="addForm.password" :label="$t('user.password')" filled rounded dense type="password" />
          <q-toggle v-model="addForm.teacher" :label="$t('users.teacher_role.title')" color="blue" />
          <q-toggle v-model="addForm.admin" :label="$t('users.admin_role.title')" color="red" />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat rounded :label="$t('misc.cancel')" v-close-popup />
          <q-btn rounded color="primary" :label="$t('misc.create')" :loading="addingUser" @click="addUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Store } from 'stores/Store'
import { orpc } from '../lib/orpc.ts'
import type { User, File } from '@Stendhal/lib/src/db/types'

const q = useQuasar()
const store = Store()
const { t } = useI18n()
const router = useRouter()

const searchQuery = ref('')
const results: Ref<User[]> = ref([])
const searching = ref(false)
const selectedUser: Ref<User | null> = ref(null)
const saving = ref(false)
const showSaved = ref(false)
const showAddDialog = ref(false)
const addingUser = ref(false)
const userFiles: Ref<File[]> = ref([])
const loadingFiles = ref(false)
const skipWatch = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const addForm = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  teacher: false,
  admin: false,
})

const editForm = ref({
  firstname: '',
  lastname: '',
  email: '',
  teacher: false,
  admin: false,
  blocked: false,
  archived: false,
})

onMounted(() => {
  if (!store.user?.admin)
    router.push('/')
})

function avatarColor(user: User): string {
  if (user.archived) return 'avatar--grey'
  if (user.blocked) return 'avatar--orange'
  if (user.admin) return 'avatar--red'
  if (user.teacher) return 'avatar--blue'
  return 'avatar--green'
}

async function onSearch(query: string | number | null): Promise<void> {
  const s = String(query || '').trim()
  if (!s) {
    results.value = []
    return
  }

  searching.value = true
  try {
    results.value = await orpc.admin.users.search({ query: s })
  } catch (err) {
    console.error(err)
    results.value = []
  } finally {
    searching.value = false
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function totalSize(): number {
  return userFiles.value.reduce((sum, f) => sum + (f.size || 0), 0)
}

function fileIcon(mimeType: string | null): string {
  if (!mimeType) return 'insert_drive_file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'movie'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'folder_zip'
  if (mimeType.includes('text') || mimeType.includes('document')) return 'description'
  return 'insert_drive_file'
}

async function selectUser(user: User): Promise<void> {
  selectedUser.value = user
  skipWatch.value = true
  editForm.value = {
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    teacher: user.teacher,
    admin: user.admin,
    blocked: user.blocked ?? false,
    archived: user.archived,
  }
  nextTick(() => { skipWatch.value = false })

  // Fetch user files
  loadingFiles.value = true
  try {
    userFiles.value = await orpc.file.list({ userId: user.id })
  } catch (err) {
    console.error(err)
    userFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

// Auto-save with debounce
watch(editForm, () => {
  if (skipWatch.value || !selectedUser.value) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => autoSave(), 800)
}, { deep: true })

async function autoSave(): Promise<void> {
  if (!selectedUser.value) return

  saving.value = true
  showSaved.value = false
  try {
    const updated = await orpc.admin.users.update({
      userId: selectedUser.value.id,
      data: editForm.value,
    })

    const idx = results.value.findIndex(u => u.id === selectedUser.value!.id)
    if (idx !== -1) results.value[idx] = updated
    selectedUser.value = updated

    saving.value = false
    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 2000)
  } catch (err) {
    saving.value = false
    q.notify({ type: 'negative', message: t('misc.error_message') })
    console.error(err)
  }
}

async function addUser(): Promise<void> {
  addingUser.value = true
  try {
    await orpc.admin.users.create(addForm.value)
    q.notify({ type: 'positive', message: t('users.user_added') })
    showAddDialog.value = false
    addForm.value = { firstname: '', lastname: '', email: '', password: '', teacher: false, admin: false }
    if (searchQuery.value) await onSearch(searchQuery.value)
  } catch (err) {
    q.notify({ type: 'negative', message: t('misc.error_message') })
    console.error(err)
  } finally {
    addingUser.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-container {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
}

.left-panel {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

// Search
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
}

// User list
.user-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  &--active {
    background-color: rgba(0, 122, 255, 0.08) !important;
  }
}

.body--dark {
  .user-card:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }
  .user-card--active {
    background-color: rgba(0, 122, 255, 0.15) !important;
  }
  .settings-card {
    background: rgba(255, 255, 255, 0.06);
  }
  .setting-divider {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .file-list {
    background: rgba(255, 255, 255, 0.06);
  }
  .file-card + .file-card {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .file-icon-wrap {
    background: rgba(255, 255, 255, 0.08);
  }
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  text-transform: uppercase;
}

.avatar--green { background: #34c759; }
.avatar--blue { background: #007aff; }
.avatar--red { background: #ff3b30; }
.avatar--orange { background: #ff9500; }
.avatar--grey { background: #8e8e93; }

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.3;
}

.user-email {
  font-size: 12px;
  color: #8e8e93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-badges {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &--red { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
  &--blue { background: rgba(0, 122, 255, 0.12); color: #007aff; }
  &--orange { background: rgba(255, 149, 0, 0.12); color: #ff9500; }
  &--grey { background: rgba(142, 142, 147, 0.12); color: #8e8e93; }
}

// Detail header
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.detail-avatar {
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

.detail-name {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.detail-meta {
  font-size: 13px;
  color: #8e8e93;
  margin-top: 2px;
}

.detail-status {
  margin-left: auto;
}

.save-indicator {
  font-size: 13px;
  font-weight: 500;

  &.saving { color: #8e8e93; }
  &.saved { color: #34c759; }
}

// Settings sections
.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8e8e93;
  margin-bottom: 8px;
  padding-left: 16px;
}

.settings-card {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 0 16px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  gap: 16px;
  padding: 4px 0;
}

.setting-label {
  font-size: 15px;
  font-weight: 400;
  flex-shrink: 0;
  min-width: 100px;
}

.setting-description {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 2px;
  line-height: 1.3;
}

.setting-input {
  flex: 1;
  :deep(.q-field__control) {
    text-align: right;
  }
  :deep(input) {
    text-align: right;
  }
}

.setting-divider {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

// Disk usage
.disk-value {
  font-size: 15px;
  font-weight: 500;
  color: #007aff;
}

// File list
.file-list {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  overflow: hidden;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.file-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
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
  font-size: 14px;
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
  line-height: 1.6;
}

// Dialog
.add-dialog {
  border-radius: 16px;
  min-width: 420px;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive
@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
  }
}
</style>
