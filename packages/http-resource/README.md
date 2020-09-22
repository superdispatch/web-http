### `@superdispatch/http-resource`

[![npm](https://img.shields.io/npm/v/@superdispatch/http-resource)](https://www.npmjs.com/package/@superdispatch/http-resource)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/@superdispatch/http-resource.svg)](https://bundlephobia.com/result?p=@superdispatch/http-resource)

#### Installation

```bash
yarn add @superdispatch/http-resource
```

#### Usage

```ts
import { createHTTP } from '@superdispatch/http';
import { useHTTPResource } from '@superdispatch/http-resource';

export function useAPI() {
  const { token } = useAuth();

  return useMemo(
    () =>
      createHTTP({
        baseURL: 'http://example.com',
        headers: { authorization: `Token ${token}` },
      }),
    [token],
  );
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  createdAt: number;
  updatedAt: number;
}

export function useUsersPage(
  status: 'active' | 'inactive' | 'deleted' = 'active',
  params?: { q?: string; page?: number; page_size?: number },
) {
  const { requestJSON } = useAPI();

  return useHTTPResource<{ items: User[]; count: number }>(
    [
      // `{ status: 'active' }` -> `/users/active`
      // `{ status: 'inactive', q: 'foo' }` -> `/users/inactive?q=foo`
      '/users/{status}{?q,page,page_size}',
      { status, ...params },
    ],
    requestJSON,
  );
}

export function useUser(id: number) {
  const { requestJSON } = useAPI();

  return useHTTPResource<
    User,
    // It is possible to strongly type allowed URI Template params.
    { id: number }
  >(['/users/{id}', { id }], requestJSON);
}
```
