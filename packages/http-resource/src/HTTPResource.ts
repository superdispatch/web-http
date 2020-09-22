import {
  HTTPEndpointParams,
  parseHTTPEndpoint,
  URITemplateParams,
} from '@superdispatch/http';
import deepEqual from 'fast-deep-equal';
import useSWR, {
  cache,
  ConfigInterface,
  mutate as mutateSWR,
  responseInterface as ResponseInterface,
} from 'swr';

import { useDeepEqualMemo } from './utils/useDeepEqualMemo';

export type HTTPResourceFetcher<
  TData,
  TParams extends URITemplateParams = URITemplateParams
> = (template: string, options?: HTTPEndpointParams<TParams>) => Promise<TData>;

export type HTTPResourceFetcherArgs<
  TParams extends URITemplateParams
> = Parameters<HTTPResourceFetcher<unknown, TParams>>;

export type HTTPResourceInput<TParams extends URITemplateParams> =
  | string
  | Required<HTTPResourceFetcherArgs<TParams>>;

function inputToArgs<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceFetcherArgs<TParams> {
  return typeof input === 'string' ? [input] : input;
}

function argsToKey<TParams extends URITemplateParams>(
  args: HTTPResourceFetcherArgs<TParams>,
): string {
  const { url, body, method } = parseHTTPEndpoint(...args);
  const keys = [method, url];

  if (typeof body == 'string') {
    keys.push(body);
  }

  return keys.join(' ');
}

function inputToKey<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): string {
  return argsToKey(inputToArgs(input));
}

export interface HTTPResourceOptions<TData>
  extends Omit<ConfigInterface<TData, Error>, 'fetcher' | 'suspense'> {
  skip?: boolean;
}

export function useHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: HTTPResourceInput<TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  { skip, compare = deepEqual, ...options }: HTTPResourceOptions<TData> = {},
): ResponseInterface<TData, Error> {
  const [template, params, key] = useDeepEqualMemo(
    () => {
      const [nextTemplate, nextParams] = inputToArgs(input);
      const nextKey = argsToKey([nextTemplate, nextParams]);

      return [nextTemplate, nextParams, nextKey];
    },
    [input],
    compare,
  );

  return useSWR<TData, Error>(skip ? null : key, {
    ...options,
    compare,
    fetcher: () => fetcher(template, params),
  });
}

export function revalidateHTTPResource<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): Promise<void> {
  return mutateSWR(inputToKey(input)) as Promise<void>;
}

export function mutateHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: HTTPResourceInput<TParams>,
  fn: (prev: TData) => TData,
  shouldRevalidate?: boolean,
) {
  return mutateSWR(inputToKey(input), fn, shouldRevalidate) as Promise<void>;
}

export function clearHTTPResourceCache() {
  cache.clear();
}
