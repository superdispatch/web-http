import { useDeepEqualMemo } from '@superdispatch/hooks';
import {
  HTTPEndpointOptions,
  HTTPEndpointParams,
  URITemplateParams,
} from '@superdispatch/http';
import deepEqual from 'fast-deep-equal';
import {
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface,
  useSWRInfinite,
} from 'swr';

import { argsToKey, inputToArgs } from './internal/utils';
import { HTTPResourceFetcher, HTTPResourceInput } from './types';

export type HTTPInfiniteResourceOptions<TData> = Omit<
  SWRInfiniteConfigInterface<TData, Error>,
  'fetcher' | 'suspense'
>;

export type HTTPInfiniteResourceParamFactory<
  TData,
  TParams extends URITemplateParams = URITemplateParams
> = (index: number, prev: TData | null) => null | HTTPEndpointParams<TParams>;

export type HTTPInfiniteResource<TData> = SWRInfiniteResponseInterface<
  TData,
  Error
>;

export function useHTTPInfiniteResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: HTTPResourceInput<TParams>,
  makeParams: HTTPInfiniteResourceParamFactory<TData, TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  { compare = deepEqual, ...options }: HTTPInfiniteResourceOptions<TData> = {},
): HTTPInfiniteResource<TData> {
  const [template, baseParams] = useDeepEqualMemo(() => inputToArgs(input), [
    input,
  ]);

  return useSWRInfinite<TData, Error>(
    (index, prev) => {
      const pageParams = makeParams(index, prev);

      return (
        pageParams && argsToKey([template, { ...baseParams, ...pageParams }])
      );
    },
    (method: string, url: string, body?: string) => {
      const params: HTTPEndpointOptions = { ...baseParams };

      if (body != null) {
        params.body = body;
      }

      return fetcher(`${method} ${url}`, params);
    },
    { ...options, compare },
  );
}
