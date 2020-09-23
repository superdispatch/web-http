import { URITemplateParams } from '@superdispatch/http';
import { cache, mutate as mutateSWR } from 'swr';

import { HTTPResourceInput, inputToKey } from './utils/types';

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
