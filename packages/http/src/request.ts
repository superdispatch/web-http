import { requestEndpoint } from './request-endpoint';
import { Endpoint, EndpointParseOptions } from './utils/Endpoint';

export interface RequestOptions extends EndpointParseOptions {
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

export function request(
  url: string,
  { fetch, signal, ...options }: RequestOptions = {},
) {
  const endpoint = new Endpoint(url).parse(options);

  return requestEndpoint({ ...endpoint, fetch, signal });
}

export interface RequestJSONOptions<T> extends RequestOptions {
  parseJSON?: (json: string) => T;
}

function defaultParseJSON<T>(json: string): T {
  return JSON.parse(json) as T;
}

export function requestJSON<T>(
  url: string,
  { parseJSON = defaultParseJSON, ...options }: RequestJSONOptions<T> = {},
): Promise<T> {
  return request(url, options)
    .then((response) => response.text())
    .then(parseJSON);
}
