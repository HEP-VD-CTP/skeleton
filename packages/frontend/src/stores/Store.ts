import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

const isBrowser = typeof window !== 'undefined'

export type Theme = 'light' | 'dark'
export type Lang = 'fr'


import type { 
  User
} from "@Stendhal/lib/src/db/types"

export const Store = defineStore('store', () => {

  // #######
  // # env #
  // #######
  const env: Ref<string> = ref('development')

  function getEnv(): string {
    return env.value
  }

  function setEnv(newEnv: string): void {
    env.value = newEnv
  }

  // ################
  // # Organization #
  // ################
  const organization: Ref<string> = ref('')

  function getOrganization(): string {
    return organization.value
  }

  function setOrganization(newOrganization: string): void {
    organization.value = newOrganization
  }

  // ##########
  // # domain #
  // ##########
  const domain: Ref<string> = ref('')
  
  function getDomain(): string {
    return domain.value
  }

  function setDomain(newDomain: string): void {
    domain.value = newDomain
  }

  // ##############
  // # page title #
  // ##############
  const title: Ref<string> = ref('Stendhal')

  function getTitle(): string {
    return title.value
  }

  function setTitle(newTitle: string): void {
    title.value = newTitle
  }

  // ###########
  // # language #
  // ###########
  const language: Ref<Lang | null> = ref(null)

  // Initialize from localStorage on client side
  function initLanguage(): void {
    if (isBrowser) {
      const saved = localStorage.getItem('language')
      if (saved == 'fr') {
        language.value = saved
      }
    }
  }

  function getLanguage(): Lang | null {
    return language.value
  }

  function setLanguage(lang: Lang): void {
    language.value = lang
    if (isBrowser) {
      localStorage.setItem('language', lang)
    }
  }

  // #########
  // # theme #
  // #########
  const theme: Ref<Theme | null> = ref(null)

  // Initialize from localStorage on client side
  function initTheme(): void {
    if (isBrowser) {
      const saved = localStorage.getItem('theme')
      if (saved == 'light' || saved == 'dark') {
        theme.value = saved
      }
    }
  }

  function getTheme(): Theme | null {
    return theme.value
  }

  function setTheme(newTheme: Theme): void {
    theme.value = newTheme
    if (isBrowser) {
      localStorage.setItem('theme', newTheme)
    }
  }

  // ########
  // # User #
  // ########
  const user: Ref<User|null> = ref(null)
  
  function getUser(): User|null {
    return user.value
  }
  function setUser(newUser: User|null): void {
    user.value = newUser
  }


  return {   

    env,
    getEnv,
    setEnv,

    organization,
    getOrganization,
    setOrganization,

    domain,
    getDomain,
    setDomain,

    title,
    getTitle,
    setTitle,

    language,
    initLanguage,
    getLanguage,
    setLanguage,

    theme,
    initTheme,
    getTheme,
    setTheme,

    user, 
    setUser,
    getUser,
  }
})