### `@superdispatch/http`

[![npm](https://img.shields.io/npm/v/@superdispatch/http)](https://www.npmjs.com/package/@superdispatch/http)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/@superdispatch/http.svg)](https://bundlephobia.com/result?p=@superdispatch/http)

#### Installation

```bash
yarn add @superdispatch/http
```

#### Usage

```ts
import { createHTTP } from '@superdispatch/http';

export function createAPI(token: string | undefined) {
  return createHTTP({
    baseURL: 'http://example.com',
    headers: !token ? undefined : { authorization: `Token ${token}` },
  });
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  createdAt: number;
  updatedAt: number;
}

export function createUserAPI(token: string | undefined) {
  const { request, requestJSON } = createAPI(token);

  return {
    listUsers(
      status: 'active' | 'inactive' | 'deleted' = 'active',
      params?: { q?: string; page?: number; page_size?: number },
    ) {
      // This will make `listUsers` return `Promise<{ items: User[]; count: number }>`
      return requestJSON<{ items: User[]; count: number }>(
        // `{ status: 'active' }` -> `/users/active`
        // `{ status: 'inactive', q: 'foo' }` -> `/users/inactive?q=foo`
        '/users/{status}{?q,page,page_size}',
        { status, ...params },
      );
    },

    getUser(id: number) {
      return requestJSON<
        User,
        // It is possible to strongly type allowed URI Template params.
        { id: number }
      >('/users/{id}', { id });
    },

    addUser(values: Pick<User, 'username' | 'fullName'>) {
      // You can pass a HTTP method in the beggining of the URI template.
      return requestJSON<User>('POST /users', {
        // Passing `json` will transform it's value with `JSON.stringify` and
        // and set `content-type: application/json` header.
        json: values,
      });
    },

    editUser(id: number, values: Pick<User, 'username' | 'fullName'>) {
      return requestJSON<User, { id: number }>('PUT /users/{id}', {
        // URI template variables will be extracted from the options.
        id,
        json: values,
      });
    },

    deleteUser(id: number): Promise<Response> {
      // When we do not care about response body we can use `request` method
      // directly.
      return request<{ id: number }>('DELETE /users/{id}', { id });
    },
  };
}
```
