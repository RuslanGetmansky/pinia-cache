import { beforeAll, describe, expect, it } from '@jest/globals'
import { initPlugin } from './helpers'
import { defineStore } from 'pinia'

beforeAll(() => {
  initPlugin()
})

describe('store.cache.state', () => {
  it('state before & after dispatches', () => {
    let val = 'foo'

    const useStore = defineStore('test', {
      actions: {
        A: () => {
          val = 'bar'
        },
      },
    })
    const store = useStore()

    // store.action()
    expect(store.cache.state()).toBeDefined()
    expect(store.cache.state().size).toBe(0)

    store.cache.dispatch('A', 'foobar')

    expect(val).toBe('bar')
    expect(store.cache.state().size).toBe(1)
  })
})
