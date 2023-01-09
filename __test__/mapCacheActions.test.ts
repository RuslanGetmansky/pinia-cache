/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { defineComponent } from 'vue'
import { defineStore } from 'pinia'
import { mapCacheActions } from '../src/pinia-cache'
import { nextStoreId, getVueWrapper } from './helpers'

let storeId
beforeEach(() => {
  storeId = nextStoreId()
})

describe('mapCacheActions', () => {
  it('mapCacheActions (object)', () => {
    const a = jest.fn()
    const b = jest.fn()
    const useStore = defineStore(storeId, {
      actions: {
        a,
        b,
      },
    })

    const Component = defineComponent({
      template: `<p></p>`,
      methods: {
        ...mapCacheActions(useStore, {
          foo: 'a',
          bar: 'b',
        }),
      },
    })

    const wrapper = getVueWrapper(Component)
    wrapper.vm.foo()
    expect(a).toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    wrapper.vm.bar()
    expect(b).toHaveBeenCalled()
  })

  it('mapCacheActions (array)', () => {
    const a = jest.fn()
    const b = jest.fn()
    const useStore = defineStore(storeId, {
      actions: {
        a,
        b,
      },
    })

    const Component = defineComponent({
      template: `<p></p>`,
      methods: {
        ...mapCacheActions(useStore, ['a', 'b']),
      },
    })

    const wrapper = getVueWrapper(Component)
    wrapper.vm.a()
    expect(a).toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    wrapper.vm.b()
    expect(b).toHaveBeenCalled()
  })
})
