import { markRaw } from 'vue-demi'
import {
  _GettersTree,
  PiniaPluginContext,
  StateTree,
  Store,
  StoreDefinition,
} from 'pinia'
import 'pinia'

type CacheOptions = {
  timeout?: number
}

type Payload = unknown | Record<string, unknown>

declare module 'pinia' {
  export interface PiniaCustomProperties {
    cache: Cache
  }

  export interface DefineStoreOptionsBase<S, Store> {
    cache?: CacheOptions
  }
}

function isObject(value: unknown): boolean {
  return !!value && typeof value === 'object'
}

function isPromise(value: unknown): boolean {
  return !!value && value instanceof Promise
}

function toString(value: unknown): string {
  return isObject(value) ? JSON.stringify(value) : String(value)
}

/**
 * Generate key from Dispatch parameters.
 */
function generateKey(action: string, payload?: Payload): string | null {
  try {
    return `${action}:${toString(payload)}`
  } catch (_) {
    return null
  }
}

/**
 * Check if value has timeout property.
 */
const hasTimeout = (value: unknown): boolean => {
  return isObject(value) && typeof (value as CacheOptions).timeout === 'number'
}

/**
 * Check if value (time) is expired.
 */
const isExpired = (expiresIn: number): boolean => {
  return expiresIn && Date.now() > expiresIn
}

type CacheRecord = {
  expiresIn: number
  value: Promise<unknown>
}

class Cache {
  private _state: Map<string, CacheRecord> = new Map()

  private readonly _store: Store
  private readonly _options: CacheOptions

  constructor(store: Store, options: CacheOptions) {
    this._store = store
    this._options = options
  }

  /**
   * Resolve timeout from parameters and plugin options.
   */
  private resolveTimeout(dispatchOptions: CacheOptions = {}): number {
    if (hasTimeout(dispatchOptions)) {
      return dispatchOptions.timeout
    } else if (hasTimeout(this._options)) {
      return this._options.timeout
    }
    return 0
  }

  /**
   * Dispatch an action and set it on cache.
   * @param {String} action
   * @param {?any} payload
   * @param {?any} options
   * @returns {Promise<any>}
   */
  dispatch(action: string, payload?: Payload, options?: CacheOptions) {
    const entry = this._store[action]
    if (!entry) {
      throw new Error(`[pinia-cache] unknown action: ${action}`)
    }

    const key = generateKey(action, payload)
    if (key === null) {
      // Fallback on generateKey errors.
      return entry.call(this._store, payload)
    }

    const { value: cachedValue, expiresIn } = this._state.get(key) || {}
    if (!!cachedValue && !isExpired(expiresIn)) {
      return cachedValue
    }

    let result = entry.call(this._store, payload)
    if (!isPromise(result)) {
      result = Promise.resolve(result)
    }

    const timeout = this.resolveTimeout(options)

    const record = {
      expiresIn: timeout ? Date.now() + timeout : undefined,
      value: new Promise((resolve, reject) => {
        result.then(
          (res) => resolve(res),
          (error) => {
            this._state.delete(key)
            reject(error)
          },
        )
      }),
    }

    this._state.set(key, record)

    return record.value
  }

  /**
   * Check if an action dispatch is on cache.
   * @param {String} action
   * @param {?any} payload
   * * @returns {boolean}
   */
  has(action: string, payload?: Payload): boolean {
    const key = generateKey(action, payload)

    if (key === null) {
      // Fallback on generateKey errors.
      return false
    }

    const record = this._state.get(key)
    return isObject(record) && !isExpired(record.expiresIn)
  }

  /**
   * Clear cache. Returns `true` if cache was cleared and `false` otherwise.
   * If using the type parameter, only actions with the specified type are
   * deleted from cache and the number of deleted keys is returned.
   */
  clear(action?: string): boolean {
    if (action) {
      return Array.from(this._state.keys())
        .filter((key) => key.split(':')[0] === action)
        .reduce((done, key) => this._state.delete(key) || done, false)
    }

    this._state.clear()
    return true
  }

  /**
   * Delete an action dispatch from cache. Returns `true` if it was deleted
   * and `false` otherwise.
   */
  delete(action: string, payload?: Payload): boolean {
    const key = generateKey(action, payload)

    if (key === null) {
      // Fallback on generateKey errors.
      return false
    }

    return this._state.delete(key)
  }

  state() {
    return this._state
  }
}

export type MapCacheActionsReturn<A> = {
  [key in keyof A]: A[key]
}

export type MapCacheActionsObjectReturn<
  A,
  T extends Record<string, keyof A>,
> = {
  [key in keyof T]: A[T[key]]
}

export function mapCacheActions<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A,
  KeyMapper extends Record<string, keyof A>,
>(
  useStore: StoreDefinition<Id, S, G, A>,
  keysOrMapper: KeyMapper,
): MapCacheActionsObjectReturn<A, KeyMapper>

export function mapCacheActions<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A,
>(
  useStore: StoreDefinition<Id, S, G, A>,
  keys: Array<keyof A>,
): MapCacheActionsReturn<A>

export function mapCacheActions<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A,
  KeyMapper extends Record<string, keyof A>,
>(
  useStore: StoreDefinition<Id, S, G, A>,
  keysOrMapper: KeyMapper,
): MapCacheActionsReturn<A> | MapCacheActionsObjectReturn<A, KeyMapper> {
  return Array.isArray(keysOrMapper)
    ? keysOrMapper.reduce((reduced, key) => {
        reduced[key] = function (...args) {
          return useStore(this.$pinia).cache.dispatch(key, ...args)
        }
        return reduced
      }, {})
    : Object.keys(keysOrMapper).reduce((reduced, key) => {
        reduced[key] = function (...args) {
          const action = keysOrMapper[key] as string
          const cache = useStore(this.$pinia).cache

          return cache.dispatch(action, ...args)
        }
        return reduced
      }, {})
}

export function piniaCachePlugin(context: PiniaPluginContext) {
  const cacheOptions = context.options.cache ?? {}
  context.store.cache = markRaw(new Cache(context.store, cacheOptions))
}
