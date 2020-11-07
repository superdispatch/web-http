import { useDeepEqualMemo } from '@superdispatch/hooks';
import { URITemplateParams } from '@superdispatch/uri';
import useSWR, {
  ConfigInterface as SWRConfigInterface,
  responseInterface as SWRResponseInterface,
} from 'swr';

import { argsToKey, inputToArgs } from './internal/utils';
import { HTTPResourceFetcher, HTTPResourceInput } from './types';

export type HTTPResourceOptions<TData> = Omit<
  SWRConfigInterface<TData, Error>,
  'fetcher'
>;

export interface HTTPResource<TData>
  extends Omit<SWRResponseInterface<TData, Error>, 'mutate'> {
  mutate: (
    updater: (currentValue: TData | undefined) => TData | undefined,
    shouldRevalidate?: boolean,
  ) => Promise<TData | undefined>;
}

export function useHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: null | HTTPResourceInput<TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  options?: HTTPResourceOptions<TData>,
): HTTPResource<TData> {
  const [key, template, params] = useDeepEqualMemo(() => {
    if (input == null) {
      return [null];
    }

    const [nextTemplate, nextParams] = inputToArgs(input);
    const nextKey = argsToKey(nextTemplate, nextParams);

    return [nextKey, nextTemplate, nextParams];
  }, [input]);

  return useSWR<TData, Error>(key, {
    ...options,
    fetcher: !template ? undefined : () => fetcher(template, params),
  }) as HTTPResource<TData>;
}
