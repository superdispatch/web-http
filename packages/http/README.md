### `@superdispatch/http`

[![npm](https://img.shields.io/npm/v/@superdispatch/http)](https://www.npmjs.com/package/@superdispatch/http)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/@superdispatch/http.svg)](https://bundlephobia.com/result?p=@superdispatch/http)

#### Installation

```bash
yarn add @superdispatch/http
```

#### Usage

```tsx
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

export interface UserListParams {
  q?: string;
  page?: number;
  page_size?: number;
}
export interface UserListResult {
  items: User[];
  count: number;
}

export function createUserAPI(token: string | undefined) {
  const { requestJSON } = createAPI(token);

  return {
    listUsers(params?: UserListParams) {
      return requestJSON<UserListResult, UserListParams>(
        '/users{?q,page,page_size}',
        params,
      );
    },

    getUser(id: number) {
      return requestJSON<User, { id: number }>('/users/{id}', { id });
    },

    addUser(values: Pick<User, 'username' | 'fullName'>) {
      return requestJSON<User>('POST /users', { json: values });
    },

    editUser(id: number, values: Pick<User, 'username' | 'fullName'>) {
      return requestJSON<User>('PUT /users/{id}', { id, json: values });
    },

    deleteUser(id: number) {
      return requestJSON<User>('DELETE /users/{id}', { id });
    },
  };
}
```
