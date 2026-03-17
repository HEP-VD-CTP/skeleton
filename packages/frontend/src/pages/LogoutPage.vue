
<template>
  <q-page class="row items-center justify-evenly">
    <q-card style="min-width: 350px" flat>
      <q-card-section class="aligh-center">
        <div class="row justify-center text-h6">LOGOUT PAGE...</div>
      </q-card-section>
    </q-card> 
  </q-page> 
</template>

<script setup lang="ts">
import { useRouter, Router } from 'vue-router'
import { Store } from 'stores/Store'
import { orpc } from '../lib/orpc'
import { onMounted } from 'vue'

const router: Router = useRouter() 
const store = Store()

onMounted(async () => {
  // deletes user in store
  store.setUser(null)

  try {
    // deletes user session server side
    await orpc.auth.logout()
  }
  catch(err){
    console.error('Logout error:', err)
  }

  // full page reload to the home
  window.location.href = '/'
})



</script>