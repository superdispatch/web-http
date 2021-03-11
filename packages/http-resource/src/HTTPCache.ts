import { URITemplateParams } from '@superdispatch/uri';
import { cache, mutate as mutateSWR } from 'swr';
import { inputToKey } from './internal/utils';
import { HTTPResourceInput } from './types';

export function revalidateHTTPResource<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): Promise<void> {
  return mutateSWR(inputToKey(input)).then(() => void 0);
}

export function mutateHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(
  input: HTTPResourceInput<TParams>,
  fn: (prev?: TData) => TData | undefined,
  shouldRevalidate?: boolean,
) {
  return mutateSWR(inputToKey(input), fn, shouldRevalidate) as Promise<void>;
}

export function clearHTTPResourceCache() {
  cache.clear();
}

export function readCachedHTTPResource<
  TData,
  TParams extends URITemplateParams = URITemplateParams
>(input: HTTPResourceInput<TParams>): TData | undefined {
  return cache.get(inputToKey(input)) as TData | undefined;
}
