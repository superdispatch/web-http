import { HTTPEndpointParams, URITemplateParams } from '@superdispatch/http';

export type HTTPResourceKeyOption = bigint | boolean | null | number | string;

export type HTTPResourceFetcherOptions<TParams> = HTTPEndpointParams<
  { key?: HTTPResourceKeyOption } & TParams
>;

export type HTTPResourceFetcher<
  TData,
  TParams extends URITemplateParams = URITemplateParams
> = (
  template: string,
  options?: HTTPResourceFetcherOptions<TParams>,
) => Promise<TData>;

export type HTTPResourceFetcherArgs<
  TParams extends URITemplateParams
> = Parameters<HTTPResourceFetcher<unknown, TParams>>;

export type HTTPResourceInput<TParams extends URITemplateParams> =
  | string
  | HTTPResourceFetcherArgs<TParams>;

export type HTTPResourceKey = [
  method: string,
  url: string,
  body?: string,
  key?: HTTPResourceKeyOption,
];
