import { HTTPEndpointParams, URITemplateParams } from '@superdispatch/http';

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
