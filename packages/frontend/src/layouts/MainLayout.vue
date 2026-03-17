<template>
  <q-no-ssr>
    <q-layout v-if="ready" view="lHh Lpr lFf">
      <q-header elevated>
        <q-toolbar>
          <q-btn
            flat
            dense
            round
            icon="home"
            aria-label="Home"
            @click="router.push('/')"
          />

          <q-toolbar-title>
            {{ store.getTitle() }}
          </q-toolbar-title>

          <div v-if="store.user === null"> 
            <q-btn @click="settingsSelector=true" round dense flat icon="settings" />
          </div>
          <div v-else>
            <q-btn-dropdown flat no-caps :label="store.user.email">
              <q-item v-if="store.user.admin" clickable v-close-popup @click="router.push(`/admin/users`)">
                <q-item-section>
                  <q-item-label>{{ $t('users.users') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="groups" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="settingsSelector=true">
                <q-item-section>
                  <q-item-label>{{ $t('misc.settings') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="settings" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="router.push(`/logout`)">
                <q-item-section>
                  <q-item-label>{{ $t('login_page.logout_button') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="logout" />
                </q-item-section>
              </q-item>
            </q-btn-dropdown>
          </div>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <router-view />
      </q-page-container>

      <q-dialog persistent v-model="settingsSelector">
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">{{ $t('misc.settings') }}</div>
          </q-card-section>

          <q-separator size="2px" inset />

          <q-card-section class="q-pt-none q-mt-sm">
            <div class="row justify-center">
              <p class="text-weight-medium">{{ $t('misc.language') }}</p>
            </div>

            <div class="row justify-center">
              <q-btn color="primary" :outline="!(store.language == 'fr')" @click="setLanguage('fr')">Français</q-btn>
            </div>

            <div class="row justify-center q-mt-md">
              <p class="text-weight-medium">{{ $t('misc.appearance') }}</p>
            </div>
            
            <div class="row justify-center">
              <q-btn color="primary" :outline="store.theme != 'light'" @click="setTheme('light')" class="q-mr-sm">Light Mode</q-btn>
              <q-btn color="primary" :outline="store.theme != 'dark'" @click="setTheme('dark')">Dark Mode</q-btn>
            </div>

            <template v-if="store.user !== null">
              <div class="row justify-center q-mt-md">
                <p class="text-weight-medium">{{ $t('user.user_account') }}</p>
              </div>

              <q-list>
                <q-item clickable v-ripple>
                  <q-item-section>
                    <q-item-label>{{ store.user.firstname }} {{ store.user.lastname }}</q-item-label>
                    <q-item-label caption>{{ store.user.email }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="row justify-center q-mt-md">
                <q-btn color="negative" @click="changePwd" class="q-mr-sm">{{ $t('user.change_password') }}</q-btn>                
              </div>
            </template>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="OK" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-layout>
  </q-no-ssr>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, onServerPrefetch } from 'vue'
import { 
  Store, 
  type Lang 
} from 'stores/Store'
import { useI18n } from 'vue-i18n'
import { useRouter, type Router } from 'vue-router'
import { useQuasar } from 'quasar'
import type { User } from '@Stendhal/lib/src/db/types'
import { orpc } from '../lib/orpc.ts'


const q = useQuasar()
const store = Store()
const { t, locale } = useI18n()
const router: Router = useRouter() 

const settingsSelector: Ref<boolean> = ref(false)
const ready: Ref<boolean> = ref(false)

async function changePwd(): Promise<void> {
  q.dialog({
    title: t('user.change_password'),
    prompt: {
      model: '',
      isValid: val => val.length >= 6 && val.length <= 255, 
      type: 'password'
    },
    cancel: {
      label: t('misc.cancel'),
      flat: true
    },
    persistent: true
  }).onOk(async password => {
    await orpc.auth.changePassword({
      userId: store.user!.id,
      newPassword: password
    })
    .catch(err => {
      q.notify({
        type: 'negative',
        message: t('misc.error_message')
      })
      console.error(err)
    })
  })
}

// server-side logic
onServerPrefetch(async () => {
  store.setEnv(process.env.ENV || 'development')
  store.setDomain(process.env.DOMAIN || 'localhost:8443')
  store.setTitle(process.env.TITLE || 'skeleton')
  store.setOrganization(process.env.ORGANIZATION || 'My Organization')

  // check the user session
  const sessionId = q.cookies?.get('sessionId')
  if (!sessionId)
    return store.setUser(null)
  
  // try to get the user session infos
  try {
    const response = await fetch(`http://backend:9000/api/rpc/auth/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionId=${sessionId}`
      },
    })
    
    if (!response.ok) 
      throw new Error(`HTTP error! status: ${response.status}`)

    const data = (await response.json()).json as User
    store.setUser(data)
  }
  catch(err){
    console.error(`Query user session failed: ${err}`)
    store.setUser(null)
    return
  }

})

function setLanguage(lang: Lang): void {
  locale.value = lang
  store.setLanguage(lang)
}

function setTheme(theme: 'light' | 'dark'): void {
  store.setTheme(theme)
  q.dark.set(theme == 'dark')
}

onMounted(async () => {
  q.loading.show()
  document.title = store.getTitle()

  // load saved preferences from localStorage
  store.initLanguage()
  store.initTheme()

  // check if this is first visit
  const savedLanguage = store.getLanguage()
  const savedTheme = store.getTheme()
  const isFirstVisit = savedLanguage === null || savedTheme === null

  // apply saved language or default to French
  if (savedLanguage) 
    locale.value = savedLanguage
  else 
    setLanguage('fr')
  
  // apply saved theme or default to light
  if (savedTheme) 
    q.dark.set(savedTheme == 'dark')
  else 
    setTheme('light')

  // show settings dialog on first visit
  if (isFirstVisit) 
    settingsSelector.value = true

  // go back to login if the user is not logged in
  if (!store.getUser()) 
    await router.push('/login')

  // mark as ready
  ready.value = true
  q.loading.hide()
})


</script>
