import { URITemplateParams } from '@superdispatch/uri';
import {
  HTTPEndpointInput,
  HTTPEndpointOptions,
  parseHTTPEndpoint,
} from './HTTPEndpoint';
import { HTTPError } from './HTTPError';

export interface HTTPRequestOptions extends HTTPEndpointOptions {
  signal?: AbortSignal;
}

export interface HTTPRequestJSONOptions<TData> extends HTTPRequestOptions {
  parseJSON?: (json: string) => TData;
}

export interface HTTPOptions extends Pick<HTTPEndpointOptions, 'baseURL'> {
  fetch?: typeof fetch;
  headers?:
    | HTTPEndpointOptions['headers']
    | ((
        headers: HTTPEndpointOptions['headers'],
      ) => HTTPEndpointOptions['headers']);
}

function defaultParseJSON<T>(json: string): T {
  return JSON.parse(json) as T;
}

export interface HTTP {
  request: <TParams extends URITemplateParams>(
    input: HTTPEndpointInput<TParams>,
    options?: HTTPRequestOptions,
  ) => Promise<Response>;

  requestJSON: <TData, TParams extends URITemplateParams = URITemplateParams>(
    input: HTTPEndpointInput<TParams>,
    options?: HTTPRequestJSONOptions<TData>,
  ) => Promise<TData>;
}

export function createHTTP({
  fetch: fetcher,
  headers: defaultHeaders,
  baseURL: defaultBaseURL,
}: HTTPOptions = {}): HTTP {
  function request<TParams extends URITemplateParams>(
    input: HTTPEndpointInput<TParams>,
    {
      signal,
      headers,
      baseURL = defaultBaseURL,
      ...options
    }: HTTPRequestOptions = {},
  ): Promise<Response> {
    if (typeof defaultHeaders == 'function') {
      headers = { ...defaultHeaders(headers) };
    } else if (defaultHeaders) {
      headers = { ...defaultHeaders, ...headers };
    }

    const endpoint = parseHTTPEndpoint(input, { ...options, baseURL, headers });
    const requestInit: RequestInit = {
      method: endpoint.method,
      headers: endpoint.headers,
    };

    if (fetcher == null) fetcher = fetch;
    if (signal) requestInit.signal = signal;
    if (endpoint.body != null) requestInit.body = endpoint.body;

    return fetcher(endpoint.url, requestInit).then((response) => {
      if (!response.ok) throw new HTTPError(endpoint, response);
      return response;
    });
  }

  function requestJSON<TData, TParams extends URITemplateParams>(
    input: HTTPEndpointInput<TParams>,
    {
      parseJSON = defaultParseJSON,
      ...options
    }: HTTPRequestJSONOptions<TData> = {},
  ): Promise<TData> {
    return request(input, options).then((response) =>
      response.text().then(parseJSON),
    );
  }

  return { request, requestJSON };
}
