import { describe, expect, it } from '@jest/globals'
import { defineStore, setActivePinia, createPinia } from 'pinia'
import { piniaCachePlugin } from '../src/pinia-cache'
import { createApp } from 'vue'

describe('piniaCachePlugin', () => {
  it('is a function to create store plugin', () => {
    expect(typeof piniaCachePlugin).toBe('function')
  })

  it('define cache property on store', () => {
    const app = createApp({})
    const pinia = createPinia().use(piniaCachePlugin)
    app.use(pinia)
    setActivePinia(pinia)

    const useStore = defineStore('main', {})
    const store = useStore()

    expect(store).toHaveProperty('cache')
    expect(typeof store.cache.has).toBe('function')
    expect(typeof store.cache.clear).toBe('function')
    expect(typeof store.cache.delete).toBe('function')
    expect(typeof store.cache.dispatch).toBe('function')
  })
})
