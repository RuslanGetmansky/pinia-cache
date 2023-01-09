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

describe('timeout option', () => {
  it('timeout can be defined on options (3rd argument)', async () => {
    let wasCalledTimes = 0

    const useStore = defineStore(storeId, {
      actions: {
        A: () => void wasCalledTimes++,
      },
    })
    const store = useStore()

    await store.cache.dispatch('A', undefined, {
      timeout: 100,
    })

    expect(wasCalledTimes).toBe(1)

    await sleep(50)

    await store.cache.dispatch('A', undefined, {
      timeout: 100,
    })

    expect(wasCalledTimes).toBe(1)

    await sleep(100) // 50 + 100 = 150

    await store.cache.dispatch('A', undefined, {
      timeout: 100,
    })

    expect(wasCalledTimes).toBe(2)
  })

  it('timeout can be defined on store options', async () => {
    let wasCalledTimes = 0

    const useStore = defineStore(storeId, {
      actions: {
        A: () => void wasCalledTimes++,
      },

      cache: {
        timeout: 100,
      },
    })
    const store = useStore()

    await store.cache.dispatch('A')

    expect(wasCalledTimes).toBe(1)

    await sleep(50)

    await store.cache.dispatch('A')

    expect(wasCalledTimes).toBe(1)

    await sleep(100) // 50 + 100 = 150

    await store.cache.dispatch('A')

    expect(wasCalledTimes).toBe(2)
  })

  it('overwrite default timeout option on each dispatch', async () => {
    let wasCalledTimes = 0

    const useStore = defineStore(storeId, {
      actions: {
        A: () => void wasCalledTimes++,
      },

      cache: {
        timeout: 100,
      },
    })
    const store = useStore()

    await store.cache.dispatch('A', undefined, {
      timeout: 200,
    })

    await sleep(150)

    expect(wasCalledTimes).toBe(1)

    await store.cache.dispatch('A', undefined, {
      timeout: 200,
    })

    expect(wasCalledTimes).toBe(1)

    await sleep(150) // 150 + 150 = 300

    await store.cache.dispatch('A', undefined, {
      timeout: 200,
    })

    expect(wasCalledTimes).toBe(2)
  })
})
