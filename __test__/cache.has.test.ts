import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import { initPlugin, nextStoreId, sleep } from './helpers'
import { defineStore } from 'pinia'

beforeAll(() => {
  initPlugin()
})

let storeId
beforeEach(() => {
  storeId = nextStoreId()
})

describe('store.cache.has', () => {
  it('remove action from cache', async () => {
    let actionWasCalled = 0

    const useStore = defineStore(storeId, {
      actions: {
        A: () => {
          actionWasCalled++
        },
      },
    })
    const store = useStore()

    await store.cache.dispatch('A')

    expect(actionWasCalled).toBe(1)

    await store.cache.dispatch('A')

    expect(actionWasCalled).toBe(1)

    store.cache.delete('A')

    await store.cache.dispatch('A')

    expect(actionWasCalled).toBe(2)
  })

  it('check if cache has action', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {},
      },
    })
    const store = useStore()

    expect(store.cache.has('A')).toBe(false)

    store.cache.dispatch('A')

    expect(store.cache.has('A')).toBe(true)
  })

  it('returns false if action was expired', async () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {},
      },

      cache: {
        timeout: 100,
      },
    })
    const store = useStore()

    expect(store.cache.has('A')).toBe(false)

    await store.cache.dispatch('A')

    expect(store.cache.has('A')).toBe(true)

    await sleep(150)

    expect(store.cache.has('A')).toBe(false)
  })

  it("returns false if params don't match cached ones", async () => {
    const useStore = defineStore(storeId, {
      actions: {
        A() {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A', 10)

    expect(store.cache.has('A', 5)).toBe(false)

    await store.cache.dispatch('A')

    expect(store.cache.has('A', null)).toBe(false)
  })

  it('returns false if params is non JSON parseable', async () => {
    const useStore = defineStore(storeId, {
      actions: {
        A() {},
      },
    })
    const store = useStore()

    const a = { b: null }
    const b = { a }
    a.b = b

    await store.cache.dispatch('A', a)

    expect(store.cache.has('A', a)).toBe(false)
  })
})
