<template>
  <q-page class="row items-center justify-evenly">
    <q-card style="min-width: 350px; border-radius: 16px" flat :class="store.theme == 'dark' ? `bg-dark` : `bg-light`">
      <q-card-section class="aligh-center">
        <div class="row justify-center text-h3">{{ store.getTitle() }}</div>
        <div class="row justify-center text-subtitle1">{{ $t('login_page.login_page_title') }}</div>
      </q-card-section>

      <q-separator size="2px" inset />

      <q-card-section class="q-pt-none q-mt-md">
        <div class="row justify-center ">
          <p class="text-weight-medium">{{ $t('login_page.connect_with_local_account') }}</p>
        </div> 

        <q-form @submit="login">
          <q-input v-model="email" :label="t('user.email')" filled type="email" :rules="lib.rules.email(t('validation.email.mandatory'), t('validation.email.maxLength'), t('validation.email.valid'))" />
          <q-input v-model="password" filled :type="isPwd ? 'password' : 'text'" :label="t('user.password')" :rules="lib.rules.pwd(t('validation.password.mandatory'), t('validation.password.length'))">
            <template v-slot:append>
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
            </template>
          </q-input> 

          <div class="q-mt-lg text-center">
            <q-btn color="primary" :label="t('login_page.login_button')" type="submit" icon-right="login" :loading="btnLoading"/>
          </div>  
        </q-form>
      </q-card-section>
    </q-card>
  </q-page> 
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar, QVueGlobals } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter, Router } from 'vue-router'
import lib  from 'src/lib/index.ts'
import { Store } from 'stores/Store'
import { orpc } from '../lib/orpc.ts'
import { User } from '@Stendhal/lib/src/db/types'


const router: Router = useRouter() 

const store = Store()

const { t } = useI18n()

const email      = ref(``)
const password   = ref(``)
const isPwd      = ref(true)
const btnLoading = ref(false)

const q: QVueGlobals = useQuasar() 

/*function OauthLogin(){
  window.location.href = store.getOauth2Link()
}*/

async function login(): Promise<void> {
  btnLoading.value = true

  try {
    const user = await orpc.auth.login({
      email: email.value.trim(),
      password: password.value.trim(),
    }) as User

    // store the user and go back to home
    store.setUser(user) 

    // full page reload to the home
    window.location.href = '/'
  }
  catch(err){
    q.dialog({
      title: t('misc.error'),
      message: t('login_page.invalid'),
    })
  }

  btnLoading.value = false
}

onMounted(async () => {
  document.title = `${t('login_page.login_page_title')} - ${store.getTitle()}`
})

</script>
  