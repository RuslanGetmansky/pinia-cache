import { setActivePinia, createPinia } from 'pinia'
import { piniaCachePlugin } from '../src/pinia-cache'
import { createApp } from 'vue'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

export const initPlugin = () => {
  const app = createApp({})
  const pinia = createPinia().use(piniaCachePlugin)
  app.use(pinia)
  setActivePinia(pinia)
}

export const getVueWrapper = (component) => {
  return mount(component, {
    global: {
      plugins: [
        createTestingPinia({
          stubActions: false,
          plugins: [piniaCachePlugin],
        }),
      ],
    },
  })
}

const storeIdGen = (function* storeId() {
  let i = 0
  do {
    yield `test_${++i}`
  } while (true)
})()

export const nextStoreId = () => {
  return storeIdGen.next().value
}

export const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}
