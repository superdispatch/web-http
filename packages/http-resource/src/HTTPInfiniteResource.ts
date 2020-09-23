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

import {
  argsToKey,
  HTTPResourceFetcher,
  HTTPResourceInput,
  inputToArgs,
} from './utils/types';
import { useDeepEqualMemo } from './utils/useDeepEqualMemo';

export type HTTPInfiniteResourceOptions<TData> = Omit<
  SWRInfiniteConfigInterface<TData, Error>,
  'fetcher' | 'suspense'
>;

export type HTTPInfiniteResourceParamFactory<
  TData,
  TParams extends URITemplateParams = URITemplateParams
> = (index: number, prev: TData | null) => null | HTTPEndpointParams<TParams>;

export function useHTTPInfiniteResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: HTTPResourceInput<TParams>,
  makeParams: HTTPInfiniteResourceParamFactory<TData, TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  { compare = deepEqual, ...options }: HTTPInfiniteResourceOptions<TData> = {},
): SWRInfiniteResponseInterface<TData, Error> {
  const [template, baseParams] = useDeepEqualMemo(
    () => inputToArgs(input),
    [input],
    compare,
  );

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
