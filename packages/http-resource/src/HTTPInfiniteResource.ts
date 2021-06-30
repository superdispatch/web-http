import { HTTPEndpointOptions, HTTPEndpointParams } from '@superdispatch/http';
import { URITemplateParams } from '@superdispatch/uri';
import {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  useSWRInfinite,
} from 'swr';
import { argsToKey, inputToArgs } from './internal/utils';
import { HTTPResourceFetcher, HTTPResourceInput } from './types';

export type HTTPInfiniteResourceOptions<TData, TError = Error> = Omit<
  SWRInfiniteConfiguration<TData, TError>,
  'fetcher'
>;

export type HTTPInfiniteResourceParamFactory<
  TData,
  TParams extends URITemplateParams = URITemplateParams,
> = (index: number, prev: TData | null) => null | HTTPEndpointParams<TParams>;

export type HTTPInfiniteResource<TData, TError = Error> = Omit<
  SWRInfiniteResponse<TData, TError>,
  'mutate'
>;

export function useHTTPInfiniteResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams,
  TError = Error,
>(
  input: HTTPResourceInput<TParams>,
  makeParams: HTTPInfiniteResourceParamFactory<TData, TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  resourceOptions?: HTTPInfiniteResourceOptions<TData, TError>,
): HTTPInfiniteResource<TData, TError> {
  const [template, baseParams] = inputToArgs(input);

  return useSWRInfinite<TData, TError>(
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
