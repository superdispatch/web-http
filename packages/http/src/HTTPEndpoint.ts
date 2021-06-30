import { parseURITemplate, URITemplateParams } from '@superdispatch/uri';

function warning(message: string): void {
  // eslint-disable-next-line no-console
  console.error(`[HTTP] ${message}`);
}

export type HTTPEndpointMethod = typeof HTTP_ENDPOINT_METHODS[number];

const HTTP_ENDPOINT_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
] as const;

export interface HTTPEndpoint {
  url: string;
  method: HTTPEndpointMethod;
  body?: BodyInit;
  headers?: Record<string, string>;
}

export interface HTTPEndpointOptions {
  json?: unknown;
  body?: BodyInit;
  baseURL?: string;
  headers?: Record<string, string>;
}

export type HTTPEndpointTemplate = `${HTTPEndpointMethod} /${string}`;

export type HTTPEndpointInput<
  TParams extends URITemplateParams = URITemplateParams,
> =
  | HTTPEndpointTemplate
  | readonly [template: HTTPEndpointTemplate, params: TParams];

export function parseHTTPEndpoint<TParams extends URITemplateParams>(
  input: HTTPEndpointInput<TParams>,
  { json, body, baseURL, headers }: HTTPEndpointOptions = {},
): HTTPEndpoint {
  // 1. Normalize input, e.g:
  // `"/users"` -> [`"/users"`]
  // `["/users/{id}", { id: 1 }]` -> `["/users/{id}", { id: 1 }]`
  const [template, params] = typeof input == 'string' ? [input] : input;
  const endpoint: HTTPEndpoint = { method: 'GET', url: template };

  // 2. Obtain http method, e.g:
  // `"/users"` -> `{ method: "GET", url: "/users" }`
  // `"POST /users"` -> { method: "POST", url: "/users" }`
  const indexOfSpace = template.indexOf(' ');
  if (indexOfSpace === -1) {
    warning(`"template" should have a method, received "${template}".`);
  } else {
    endpoint.method = template.slice(0, indexOfSpace) as HTTPEndpointMethod;
    endpoint.url = template.slice(indexOfSpace + 1);

    if (!HTTP_ENDPOINT_METHODS.includes(endpoint.method)) {
      const upperCaseMethod =
        endpoint.method.toUpperCase() as HTTPEndpointMethod;

      if (HTTP_ENDPOINT_METHODS.includes(upperCaseMethod)) {
        warning(
          `"template" method should be in uppercase, received "${endpoint.method}" in "${template}".`,
        );

        endpoint.method = upperCaseMethod;
      } else {
        warning(
          `"template" has unknown method "${endpoint.method}" in "${template}".`,
        );
      }
    }
  }

  // 3. Normalize url, e.g:
  // `"users"` -> `"/users"`
  if (!endpoint.url.startsWith('/')) {
    endpoint.url = `/${endpoint.url}`;
    warning(`"template" should start with slash, received "${template}".`);
  }

  // 4. Inject params to url, e.g:
  // `["/users/{id}", { id: 1 }]` -> `"/users/1"`
  if (params) {
    endpoint.url = parseURITemplate(endpoint.url, params);
  }

  // 5. Prepend `baseURL` if defined.
  if (baseURL) {
    if (baseURL.endsWith('/')) {
      warning(
        `"baseURL" option should not end with slash, received "${baseURL}"`,
      );
      baseURL = baseURL.replace(/\/+$/g, '');
    }

    endpoint.url = baseURL + endpoint.url;
  }

  // 6. Set http headers if defined.
  if (headers) endpoint.headers = headers;

  // 7. Set request body if defined.
  if (body != null) endpoint.body = body;

  // 8. Serialize request body as JSON and update content type if required.
  if (json != null) {
    endpoint.body = JSON.stringify(json);
    endpoint.headers = {
      ...endpoint.headers,
      'content-type': 'application/json',
    };
  }

  return endpoint;
}
