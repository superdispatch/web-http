import { ParseEndpointOptions, URITemplateParams } from '@superdispatch/http';
import deepEqual from 'fast-deep-equal';
import useSWR, {
  ConfigInterface,
  responseInterface as ResponseInterface,
} from 'swr';

import { useDeepEqualMemo } from './utils/useDeepEqualMemo';

export type HTTPResourceKey<T extends URITemplateParams> =
  | string
  | [template: string, params: T & ParseEndpointOptions];

function normalizeHTTPResourceKey<T extends URITemplateParams>(
  key: HTTPResourceKey<T>,
): [template: string, params?: T & ParseEndpointOptions] {
  return typeof key === 'string' ? [key] : key;
}

export type HTTPResourceFetcher<
  TData,
  TParams extends URITemplateParams = URITemplateParams
> = (
  template: string,
  options?: TParams & ParseEndpointOptions,
) => Promise<TData>;

export type HTTPResourceOptions<TData> = Omit<
  ConfigInterface<TData, Error>,
  'fetcher' | 'suspense'
>;

export function useHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  key: HTTPResourceKey<TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  { compare = deepEqual, ...options }: HTTPResourceOptions<TData> = {},
): ResponseInterface<TData, Error> {
  const swrKey = useDeepEqualMemo(
    () => normalizeHTTPResourceKey(key),
    [key],
    compare,
  );

  return useSWR<TData, Error>(swrKey, { ...options, compare, fetcher });
}
