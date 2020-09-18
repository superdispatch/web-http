import { HTTPError } from './HTTPError';
import { EndpointParams } from './utils/Endpoint';

export interface RequestEndpointOptions extends EndpointParams {
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

export function requestEndpoint({
  url,
  body,
  method,
  signal,
  headers,
  fetch: fetcher = fetch,
}: RequestEndpointOptions): Promise<Response> {
  return fetcher(url, { body, method, signal, headers }).then((response) => {
    if (!response.ok) {
      throw new HTTPError({ url, body, method, headers }, response);
    }

    return response;
  });
}
