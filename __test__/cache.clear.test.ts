import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import { initPlugin, nextStoreId } from './helpers'
import { defineStore } from 'pinia'

beforeAll(() => {
  initPlugin()
})

let storeId
beforeEach(() => {
  storeId = nextStoreId()
})

describe('store.cache.clear', () => {
  it('clears all action dispatches from cache', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {},
        B: () => {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A')
    store.cache.dispatch('B', { name: 'John' })

    expect(store.cache.has('A')).toBe(true)
    expect(store.cache.has('B', { name: 'John' })).toBe(true)

    store.cache.clear()

    expect(store.cache.has('A')).toBe(false)
    expect(store.cache.has('B', { name: 'John' })).toBe(false)
  })

  it('clears only specified action dispatches from cache', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {},
        B: () => {},
        BC: () => {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A')
    store.cache.dispatch('B')
    store.cache.dispatch('B', { page: 1 })
    store.cache.dispatch('B', { page: 2 })
    store.cache.dispatch('BC')

    expect(store.cache.has('A')).toBe(true)
    expect(store.cache.has('B')).toBe(true)
    expect(store.cache.has('B', { page: 1 })).toBe(true)
    expect(store.cache.has('B', { page: 2 })).toBe(true)
    expect(store.cache.has('BC')).toBe(true)

    const cleared = store.cache.clear('B')

    expect(cleared).toBe(true)
    expect(store.cache.has('A')).toBe(true)
    expect(store.cache.has('B')).toBe(false)
    expect(store.cache.has('B', { page: 1 })).toBe(false)
    expect(store.cache.has('B', { page: 2 })).toBe(false)
    expect(store.cache.has('BC')).toBe(true)
  })

  it('clears nothing if nothing matches', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {},
        B: () => {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A')
    store.cache.dispatch('B')

    const cleared = store.cache.clear('BC')

    expect(cleared).toBe(false)
    expect(store.cache.has('A')).toBe(true)
    expect(store.cache.has('B')).toBe(true)
  })
})
