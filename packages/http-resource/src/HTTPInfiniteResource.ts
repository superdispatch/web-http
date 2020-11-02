import {
  HTTPEndpointOptions,
  HTTPEndpointParams,
  URITemplateParams,
} from '@superdispatch/http';
import {
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface,
  useSWRInfinite,
} from 'swr';

import { argsToKey, inputToArgs } from './internal/utils';
import { HTTPResourceFetcher, HTTPResourceInput } from './types';

export type HTTPInfiniteResourceOptions<TData> = Omit<
  SWRInfiniteConfigInterface<TData, Error>,
  'fetcher'
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
  resourceOptions?: HTTPInfiniteResourceOptions<TData>,
): HTTPInfiniteResource<TData> {
  const [template, baseParams] = inputToArgs(input);

  return useSWRInfinite<TData, Error>(
    (index, prev) => {
      const params = makeParams(index, prev);

      if (!params) {
        return null;
      }

      return argsToKey(template, { ...baseParams, ...params });
    },
    (method: string, url: string, body?: string) => {
      const options: HTTPEndpointOptions = { ...baseParams };

      if (body != null) {
        options.body = body;
      }

      return fetcher(`${method} ${url}`, options);
    },
    resourceOptions,
  );
}
