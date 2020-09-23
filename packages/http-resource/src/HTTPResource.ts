import { URITemplateParams } from '@superdispatch/http';
import deepEqual from 'fast-deep-equal';
import useSWR, {
  ConfigInterface,
  responseInterface as ResponseInterface,
} from 'swr';

import {
  argsToKey,
  HTTPResourceFetcher,
  HTTPResourceInput,
  inputToArgs,
} from './utils/types';
import { useDeepEqualMemo } from './utils/useDeepEqualMemo';

export type HTTPResourceOptions<TData> = Omit<
  ConfigInterface<TData, Error>,
  'fetcher' | 'suspense'
>;

export function useHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: null | undefined | HTTPResourceInput<TParams>,
  fetcher: HTTPResourceFetcher<TData>,
  { compare = deepEqual, ...options }: HTTPResourceOptions<TData> = {},
): ResponseInterface<TData, Error> {
  const [key, template, params] = useDeepEqualMemo(
    () => {
      if (input == null) {
        return [null];
      }

      const [nextTemplate, nextParams] = inputToArgs(input);
      const nextKey = argsToKey([nextTemplate, nextParams]);

      return [nextKey, nextTemplate, nextParams];
    },
    [input],
    compare,
  );

  return useSWR<TData, Error>(key, {
    ...options,
    compare,
    fetcher: !template ? undefined : () => fetcher(template, params),
  });
}
