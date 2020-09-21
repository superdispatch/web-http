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
      return requestJSON<
        { items: User[]; count: number },
        {
          q?: string;
          page?: number;
          page_size?: number;
          status: 'active' | 'inactive' | 'deleted';
        }
      >(
        // `{ status: 'active' }` -> `/users/active`
        // `{ status: 'inactive', q: 'foo' }` -> `/users/inactive?q=foo`
        '/users/{status}{?q,page,page_size}',
        { status, ...params },
      );
    },

    getUser(id: number) {
      return requestJSON<User, { id: number }>('/users/{id}', { id });
    },

    addUser(values: Pick<User, 'username' | 'fullName'>) {
      return requestJSON<User>('POST /users', { json: values });
    },

    editUser(id: number, values: Pick<User, 'username' | 'fullName'>) {
      return requestJSON<User, { id: number }>('PUT /users/{id}', {
        id,
        json: values,
      });
    },

    // Sometimes we do not care about response, and using `request` is enough,
    deleteUser(id: number): Promise<Response> {
      return request<{ id: number }>('DELETE /users/{id}', { id });
    },
  };
}
```
