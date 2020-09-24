import { HTTPError } from './HTTPError';
import {
  HTTPEndpointOptions,
  parseHTTPEndpoint,
} from './utils/parseHTTPEndpoint';
import { URITemplateParams } from './utils/parseURITemplate';

export interface HTTPRequestOptions extends HTTPEndpointOptions {
  signal?: AbortSignal;
}

export interface HTTPRequestJSONOptions<TData> extends HTTPRequestOptions {
  parseJSON?: (json: string) => TData;
}

export interface HTTPOptions
  extends Pick<HTTPEndpointOptions, 'baseURL' | 'headers'> {
  fetch?: typeof fetch;
}

function defaultParseJSON<T>(json: string): T {
  return JSON.parse(json) as T;
}

export interface HTTP {
  request: <TParams extends URITemplateParams>(
    endpoint: string,
    options?: TParams & HTTPRequestOptions,
  ) => Promise<Response>;

  requestJSON: <TData, TParams extends URITemplateParams = URITemplateParams>(
    endpoint: string,
    options?: TParams & HTTPRequestJSONOptions<TData>,
  ) => Promise<TData>;
}

export function createHTTP({
  fetch: fetcher,
  headers: defaultHeaders,
  baseURL: defaultBaseURL,
}: HTTPOptions = {}): HTTP {
  function request<TParams extends URITemplateParams>(
    template: string,
    options?: TParams & HTTPRequestOptions,
  ): Promise<Response> {
    let signal: undefined | AbortSignal;

    if (options) {
      signal = options.signal;
      options = {
        baseURL: defaultBaseURL,
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
      };
    }

    const endpoint = parseHTTPEndpoint(template, options);

    const init: RequestInit = {
      method: endpoint.method,
      headers: endpoint.headers,
    };

    if (signal != null) {
      init.signal = signal;
    }

    if (endpoint.body != null) {
      init.body = endpoint.body;
    }

    if (fetcher == null) {
      fetcher = fetch;
    }

    return fetcher(endpoint.url, init).then((response) => {
      if (!response.ok) {
        throw new HTTPError(endpoint, response);
      }

      return response;
    });
  }

  function requestJSON<TData, TParams extends URITemplateParams>(
    endpoint: string,
    options?: TParams & HTTPRequestJSONOptions<TData>,
  ): Promise<TData> {
    const parseJSON = options?.parseJSON ?? defaultParseJSON;

    return request(endpoint, options).then((response) =>
      response.text().then(parseJSON),
    );
  }

  return { request, requestJSON };
}
