import { parseURITemplate, URITemplateParams } from '@superdispatch/uri';

export interface HTTPEndpoint {
  url: string;
  method: string;
  body?: BodyInit;
  headers?: Record<string, string>;
}

export interface HTTPEndpointOptions {
  json?: unknown;
  body?: BodyInit;
  baseURL?: string;
  headers?: Record<string, string>;
}

export type HTTPEndpointInput<TParams extends URITemplateParams> =
  | string
  | readonly [template: string, params: TParams];

export function parseHTTPEndpoint<TParams extends URITemplateParams>(
  input: HTTPEndpointInput<TParams>,
  { json, body, baseURL, headers }: HTTPEndpointOptions = {},
): HTTPEndpoint {
  // 1. Normalize input, e.g:
  // `"/users"` -> [`"/users"`]
  // `["/users/{id}", { id: 1 }]` -> `["/users/{id}", { id: 1 }]`
  const [template, params] = typeof input == 'string' ? [input] : input;

  // 2. Obtain http method, e.g:
  // `"/users"` -> `{ method: "GET", url: "/users" }`
  // `"POST /users"` -> { method: "POST", url: "/users" }`
  const indexOfSpace = template.indexOf(' ');
  const endpoint: HTTPEndpoint =
    indexOfSpace === -1
      ? { method: 'GET', url: template }
      : {
          method: template.slice(0, indexOfSpace).toUpperCase(),
          url: template.slice(indexOfSpace + 1),
        };

  // 3. Inject params to url, e.g:
  // `["/users/{id}", { id: 1 }]` -> `"/users/1"`
  if (params) {
    endpoint.url = parseURITemplate(endpoint.url, params);
  }

  // 4. Prepend `baseURL` if defined.
  if (baseURL) endpoint.url = baseURL + endpoint.url;

  // 5. Set http headers if defined.
  if (headers) endpoint.headers = headers;

  // 6. Set request body if defined.
  if (body != null) endpoint.body = body;

  // 7. Serialize request body as JSON and update content type if required.
  if (json != null) {
    endpoint.body = JSON.stringify(json);
    endpoint.headers = {
      ...endpoint.headers,
      'content-type': 'application/json',
    };
  }

  return endpoint;
}
