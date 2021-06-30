## `@superdispatch/http-resource`

[![npm](https://img.shields.io/npm/v/@superdispatch/http-resource)](https://www.npmjs.com/package/@superdispatch/http-resource)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/@superdispatch/http-resource.svg)](https://bundlephobia.com/result?p=@superdispatch/http-resource)

### Installation

```bash
yarn add @superdispatch/http-resource
```

### API

#### `useHTTPResource`

> Built on top of [`useSWR`](https://swr.vercel.app/docs/options)

```ts
export type HTTPResourceOptions<TData> = Omit<
  ConfigInterface<TData, Error>,
  'fetcher'
>;

export function useHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams,
>(
  input: null | HTTPResourceInput<TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  options?: HTTPResourceOptions<TData>,
): SWRResponseInterface<TData, Error>;
```

##### Example

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

#### `useHTTPInfiniteResource`

> Built on top of [`useSWRInfinite`](https://swr.vercel.app/docs/pagination#use-swr-infinite)

```ts
export type HTTPInfiniteResourceOptions<TData> = Omit<
  SWRInfiniteConfigInterface<TData, Error>,
  'fetcher'
>;

export type HTTPInfiniteResourceParamFactory<
  TData,
  TParams extends URITemplateParams = URITemplateParams,
> = (index: number, prev: TData | null) => null | HTTPEndpointParams<TParams>;

export function useHTTPInfiniteResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams,
>(
  input: HTTPResourceInput<TParams>,
  makeParams: HTTPInfiniteResourceParamFactory<TData, TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  options?: HTTPInfiniteResourceOptions<TData>,
): SWRInfiniteResponseInterface<TData, Error>;
```

##### Example

```ts
import { createHTTP } from '@superdispatch/http';
import { useHTTPResource } from '@superdispatch/http-resource';
import { useHTTPInfiniteResource } from './HTTPInfiniteResource';

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
}

export function useUsersInfiniteList({
  q,
  page_size = 10,
}: {
  q?: string;
  page_size?: number;
} = {}) {
  const { requestJSON } = useAPI();

  return useHTTPInfiniteResource<
    { items: User[]; count: number },
    { q?: string; page?: number; page_size?: number }
  >(
    ['/users/{?q,page,page_size}', { q, page_size }],
    (index, prev) => {
      const nextPage = index + 1;
      const maxPage = !prev ? Infinity : Math.ceil(prev.count / page_size);

      // Stop loading.
      if (nextPage > maxPage) {
        return null;
      }

      return { page: nextPage };
    },
    requestJSON,
  );
}
```
