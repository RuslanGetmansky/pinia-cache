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

describe('store.cache.delete', () => {
  it("returns false if there's no action to delete", () => {
    const useStore = defineStore(storeId, {})
    const store = useStore()

    expect(store.cache.delete('UNKNOWN')).toBe(false)
  })

  it('returns false if action was already deleted', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A() {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A')

    store.cache.delete('A')

    expect(store.cache.delete('A')).toBe(false)
  })

  it('returns true if it delete action', async () => {
    const useStore = defineStore(storeId, {
      actions: {
        A() {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A')

    expect(store.cache.delete('A')).toBe(true)

    await store.cache.dispatch('A', {
      quantity: 10,
    })

    expect(
      store.cache.delete('A', {
        quantity: 10,
      }),
    ).toBe(true)
  })

  it("returns false if params don't match cached ones", async () => {
    const useStore = defineStore(storeId, {
      actions: {
        A() {},
      },
    })
    const store = useStore()

    store.cache.dispatch('A', 10)

    expect(store.cache.delete('A', 5)).toBe(false)

    await store.cache.dispatch('A')

    expect(store.cache.delete('A', null)).toBe(false)
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

    expect(store.cache.delete('A', a)).toBe(false)
  })
})
