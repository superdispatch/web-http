import { useDeepEqualMemo } from '@superdispatch/hooks';
import { URITemplateParams } from '@superdispatch/uri';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { argsToKey, inputToArgs } from './internal/utils';
import { HTTPResourceFetcher, HTTPResourceInput } from './types';

export type HTTPResourceOptions<TData, TError = Error> = Omit<
  SWRConfiguration<TData, TError>,
  'fetcher'
>;

export type HTTPResource<TData, TError = Error> = SWRResponse<TData, TError>;

export function useHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams,
  TError = Error,
>(
  input: null | HTTPResourceInput<TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  options?: HTTPResourceOptions<TData, TError>,
): HTTPResource<TData, TError> {
  const [key, template, params] = useDeepEqualMemo(() => {
    if (input == null) {
      return [null];
    }

    const [nextTemplate, nextParams] = inputToArgs(input);
    const nextKey = argsToKey(nextTemplate, nextParams);

    return [nextKey, nextTemplate, nextParams];
  }, [input]);

  return useSWR<TData, TError>(key, {
    ...options,
    fetcher: !template ? undefined : () => fetcher(template, params),
  });
}
