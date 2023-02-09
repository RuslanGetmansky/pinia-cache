# pinia-cache ![build status](https://github.com/RuslanGetmansky/pinia-cache/actions/workflows/build.yml/badge.svg?branch=main)

Inspired by [vuex-cache](https://github.com/superwf/vuex-cache)

Cache dispatched actions in memory and prevent repeated requests and heavy actions.

## Compatibility

- `Map` and `Promise` are required (you can use polyfills, like [`@babel/polyfill`](https://babeljs.io/docs/en/babel-polyfill));
- Any Vue version, since `pinia-cache` just deals with Pinia;
- Pinia version 2.

## Installation

`pinia-cache` is published in the NPM registry and can be installed using any compatible package manager.

```sh
npm install pinia-cache --save

# For Yarn use the command below.
yarn add pinia-cache
```

## Vue 2 setup example

Import `piniaCachePlugin` factory and use it as a `Pinia`'s plugin.

```js
import Vue from 'vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import { piniaCachePlugin } from 'pinia-cache';

Vue.use(PiniaVuePlugin)
const pinia = createPinia().use(piniaCachePlugin);

new Vue({
  pinia,
  ...,
});
```

## Usage

After install you can use `cache` property to call cache methods.

```js
import { defineStore } from 'pinia'

const useStore = defineStore('storeId', {
  actions: {
    async fetchUser(id) {
      const response = await fetch(baseURL + '/user/' + id);
      const { users } = await response.json();
      return users;
    }
  }
});

const store = useStore();
store.cache.dispatch('fetchUser', 1);
//=> Promise { User }
```

## API

### `piniaCachePlugin`

The default exported factory to create `Pinia`'s store plugin. It defines `cache` property on Store instances.

```js
import { createPinia, defineStore } from 'pinia';
import { piniaCachePlugin } from 'pinia-cache';

const pinia = createPinia().use(piniaCachePlugin);
const useStore = defineStore('storeId', {
    ...
});
```

### `store.cache.dispatch`

Dispatches an action if it's not cached and set it on cache, otherwise it returns cached `Promise`.

> It uses action **name** and **payload** as cache key.

```js
store.cache.dispatch('fetchUser');
//=> Promise { User }

// Returns value without dispatching the action again.
store.cache.dispatch('fetchUser');
//=> Promise { User }
```

### `store.cache.has`

Check if an action is cached. Returns `true` if action is cached and `false` otherwise.

```js
store.cache.has('fetchUser');
//=> true

store.cache.has('fetchRepository', 219);
//=> false
```

### `store.cache.delete`

Delete an action from cache. Returns `true` if action is deleted and `false` otherwise.

```js
store.cache.delete('fetchUser');
//=> true

store.cache.delete('fetchRepository', 219);
//=> false
```

> Only exact matches are deleted. Use `store.cache.clear` to delete all items or by action name.

### `store.cache.clear`

Clear the cache, delete all actions from it. Returns `true` if cache is cleared and `false` otherwise.

```js
store.cache.clear();
//=> true
```

If using the type parameter, only actions with the specified type are deleted from cache.

```js
// store.cache.dispatch('fetchRepository', { page: 1 });
// store.cache.dispatch('fetchRepository', { page: 2 });
store.cache.clear('fetchRepository');
//=> true
```

### `store.cache.state`

> Warning! Don't use this method in production.

Helper method for debugging. Prints the current value of the cache (state).

```js
store.cache.dispatch('fetchRepository', { page: 1 });
store.cache.dispatch('fetchRepository', { page: 2 });
store.cache.state();
//=> Map(2){...}
```

### `mapCacheActions`

Create component methods that dispatch a cached action.

```js
import { mapCacheActions } from 'pinia-cache';
import { useRepositoryStore } from '../repository-store';
import { useUserStore } from '../user-store';

export default {
  name: 'Users',
  methods: {
    ...mapCacheActions(useRepositoryStore, ['fetchRepository']),
    ...mapCacheActions(useUserStore, ['fetchUser']),
  },
  async mounted() {
    await this.fetchUser();
    await this.fetchRepository(219, {
      timeout: 30000
    });
  }
}
```

### Payload

The payload value is `undefined` as default and supports primitive values and JSON parseable objects.

`store.cache.dispatch`, `store.cache.has` and `store.cache.delete` supports payload object as argument.

```js
store.cache.dispatch('fetchRepository', {
  id: 198
});
//=> Promise { Repository }

store.cache.has('fetchRepository', {
  id: 198
});
//=> true

store.cache.delete('fetchRepository', {
  id: 198
});
//=> true
```

### Timeout

`timeout` option is `0` as default and define cache duration is milliseconds.

> **`0`** means it has no defined duration, no timeout.

```js
const useStore = defineStore('storeId', {
  actions: {
    fetchRepository: () => {},
  },

  cache: {
    timeout: 100,
  },
});
```

After milliseconds defined in timeout option an action is expired from cache.

```js
// This dispatches the action and set it on cache.
store.cache.dispatch('fetchRepository', 219);
//=> Promise { Repository }

store.cache.has('fetchRepository', 219);
//=> true

setTimeout(() => {

  // It returns false because the action is expired.
  store.cache.has('fetchRepository', 219);
  //=> false

  // This dispatches the action again because the action is expired.
  store.cache.dispatch('fetchRepository', 219);
  //=> Promise { Repository }
}, 10000)
```

Store's timeout can be overwritten by dispatch timeout option in Dispatch Options.

```js
store.cache.dispatch('fetchRepository', 219, {
  timeout: 30000
});
```
