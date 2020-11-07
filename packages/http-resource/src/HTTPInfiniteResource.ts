import { HTTPEndpointOptions, HTTPEndpointParams } from '@superdispatch/http';
import { URITemplateParams } from '@superdispatch/uri';
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

export interface HTTPInfiniteResource<TData>
  extends Omit<SWRInfiniteResponseInterface<TData, Error>, 'mutate'> {
  mutate: (
    updater: (currentValue: TData[] | undefined) => TData[] | undefined,
    shouldRevalidate?: boolean,
  ) => Promise<TData[] | undefined>;
}

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
  ) as HTTPInfiniteResource<TData>;
}
