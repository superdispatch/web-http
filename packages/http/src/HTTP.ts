import { HTTPError } from './HTTPError';
import { parseEndpoint, ParseEndpointOptions } from './utils/parseEndpoint';
import { URITemplateParams } from './utils/parseURITemplate';

export interface HTTPRequestOptions extends ParseEndpointOptions {
  signal?: AbortSignal;
}

export interface HTTPRequestJSONOptions<TData> extends HTTPRequestOptions {
  parseJSON?: (json: string) => TData;
}

export interface HTTPOptions
  extends Pick<ParseEndpointOptions, 'baseURL' | 'headers'> {
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

  requestJSON: <TData, TParams extends URITemplateParams>(
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
    let endpointOptions: ParseEndpointOptions = {};

    if (options) {
      ({ signal, ...endpointOptions } = options);
    }

    if (defaultBaseURL != null && endpointOptions.baseURL == null) {
      endpointOptions.baseURL = defaultBaseURL;
    }

    if (defaultHeaders != null) {
      endpointOptions.headers = {
        ...defaultHeaders,
        ...endpointOptions.headers,
      };
    }

    const endpoint = parseEndpoint(template, endpointOptions);

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
    let endpointOptions: HTTPRequestOptions = {};
    let parseJSON: HTTPRequestJSONOptions<TData>['parseJSON'];

    if (options) {
      ({ parseJSON, ...endpointOptions } = options);
    }

    if (parseJSON == null) {
      parseJSON = defaultParseJSON;
    }

    return request(endpoint, endpointOptions).then((response) =>
      response.text().then(parseJSON),
    );
  }

  return { request, requestJSON };
}
