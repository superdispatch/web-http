import {
  HTTPEndpointParams,
  parseHTTPEndpoint,
  URITemplateParams,
} from '@superdispatch/http';

export type HTTPResourceFetcher<
  TData,
  TParams extends URITemplateParams = URITemplateParams
> = (template: string, options?: HTTPEndpointParams<TParams>) => Promise<TData>;

export type HTTPResourceFetcherArgs<
  TParams extends URITemplateParams
> = Parameters<HTTPResourceFetcher<unknown, TParams>>;

export type HTTPResourceInput<TParams extends URITemplateParams> =
  | string
  | Required<HTTPResourceFetcherArgs<TParams>>;

export type HTTPResourceKey = [method: string, url: string, body?: string];

export function inputToArgs<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceFetcherArgs<TParams> {
  return typeof input === 'string' ? [input] : input;
}

export function argsToKey<TParams extends URITemplateParams>(
  args: HTTPResourceFetcherArgs<TParams>,
): HTTPResourceKey {
  const { url, body, method } = parseHTTPEndpoint(...args);

  return [method, url, typeof body == 'string' ? body : undefined];
}

export function inputToKey<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceKey {
  return argsToKey(inputToArgs(input));
}
