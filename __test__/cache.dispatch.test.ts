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

describe('store.cache.dispatch', () => {
  it('fails on unknown action', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {},
      },
    })
    const store = useStore()

    expect(() => store.cache.dispatch('B')).toThrow(Error)
  })

  it('dispatches the action of an "option" store', () => {
    let actionWasCalledTimes = 0

    const useStore = defineStore(storeId, {
      actions: {
        A: () => {
          actionWasCalledTimes++
        },
      },
    })
    const store = useStore()

    expect(actionWasCalledTimes).toBe(0)

    store.cache.dispatch('A')

    expect(actionWasCalledTimes).toBe(1)
  })

  it('dispatches the action of a "setup" store', () => {
    let actionWasCalledTimes = 0

    const useStore = defineStore(storeId, () => {
      function A() {
        actionWasCalledTimes++
      }
      return { A }
    })
    const store = useStore()

    expect(actionWasCalledTimes).toBe(0)

    store.cache.dispatch('A')

    expect(actionWasCalledTimes).toBe(1)
  })

  it('uses action name and payload to create key', () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: (payload) => payload,
      },
    })
    const store = useStore()

    expect(store.cache.has('A')).toBe(false)
    expect(store.cache.has('A', { payload: 'payload' })).toBe(false)

    store.cache.dispatch('A', { payload: 'payload' })

    expect(store.cache.has('A')).toBe(false)
    expect(store.cache.has('A', { payload: 'payload' })).toBe(true)
  })

  it('set action dispatch on cache', () => {
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

  it('return from cache after first dispatch', async () => {
    let _id = 0
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {
          _id++
          return _id
        },
      },
    })
    const store = useStore()

    await expect(store.cache.dispatch('A')).resolves.toBe(1)
    await expect(store.cache.dispatch('A')).resolves.toBe(1)

    store.cache.delete('A')

    await expect(store.cache.dispatch('A')).resolves.toBe(2)
    await expect(store.cache.dispatch('A')).resolves.toBe(2)
  })

  it('dispatches long running concurrent action', async () => {
    let _id = 0
    const useStore = defineStore(storeId, {
      actions: {
        A: async () => {
          await sleep(1000)
          _id++
          return _id
        },
      },
    })
    const store = useStore()

    const result1 = store.cache.dispatch('A')
    await sleep(500)
    const result2 = store.cache.dispatch('A')

    await expect(result1).resolves.toBe(1)
    await expect(result2).resolves.toBe(1)
  })

  it("use payload to generate cache's key with fake request answers", async () => {
    let _id = 0
    const useStore = defineStore(storeId, {
      actions: {
        A: () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              _id++
              resolve(_id)
            }, 500 - _id * 150)
          })
        },
      },
    })
    const store = useStore()

    await expect(store.cache.dispatch('A', { value: 1 })).resolves.toBe(1)
    await expect(store.cache.dispatch('A', { value: 2 })).resolves.toBe(2)

    await expect(store.cache.dispatch('A', { value: 1 })).resolves.toBe(1)
    await expect(store.cache.dispatch('A', { value: 2 })).resolves.toBe(2)
  })

  it('deletes action from cache on rejection', async () => {
    const useStore = defineStore(storeId, {
      actions: {
        A: async () => {
          throw new Error('An unknown error.')
        },
      },
    })
    const store = useStore()

    const action = store.cache.dispatch('A')
    expect(store.cache.has('A')).toBe(true)
    await expect(action).rejects.toThrow('An unknown error.')

    expect(store.cache.has('A')).toBe(false)
  })

  it('non JSON parsable just fallback to native dispatch', async () => {
    let wasCalled = false

    const useStore = defineStore(storeId, {
      actions: {
        A: () => {
          wasCalled = true
        },
      },
    })
    const store = useStore()

    const a = { b: null }
    a.b = { a }

    await store.cache.dispatch('A', a)

    expect(wasCalled).toBe(true)
    expect(store.cache.has('A', a)).toBe(false)
  })

  it('dispatches cached action from another one', async () => {
    let wasACalled = 0
    let wasBCalled = 0

    const useStore = defineStore(storeId, {
      actions: {
        A: () => void wasACalled++,
        B: () => {
          wasBCalled++

          const store = useStore()
          store.cache.dispatch('A')
        },
      },
    })
    const store = useStore()

    expect(wasACalled).toBe(0)
    expect(wasBCalled).toBe(0)

    await store.cache.dispatch('A')

    expect(wasACalled).toBe(1)
    expect(wasBCalled).toBe(0)

    await store.cache.dispatch('B')

    expect(wasACalled).toBe(1)
    expect(wasBCalled).toBe(1)
  })
})
