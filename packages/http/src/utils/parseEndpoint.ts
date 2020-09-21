import { parseURITemplate, URITemplateParams } from './parseURITemplate';

const METHOD_PATTERN = /^([\w]+) (.+)/;

function parseEndpointTemplate<T extends URITemplateParams>(
  url: string,
  params?: T,
): [method: string, url: string] {
  const matches = METHOD_PATTERN.exec(url);
  let method = 'GET';

  if (matches) {
    url = matches[2];
    method = matches[1].toUpperCase();
  }

  if (params != null) {
    url = parseURITemplate(url, params);
  }

  return [method.toUpperCase(), url];
}

export interface Endpoint {
  url: string;
  body?: BodyInit;
  method: string;
  headers: Record<string, string>;
}

export interface ParseEndpointOptions {
  json?: unknown;
  body?: BodyInit;
  baseURL?: string;
  headers?: Record<string, string>;
}

export function parseEndpoint<T extends URITemplateParams>(
  template: string,
  params?: T,
  { body, headers, json, baseURL = '' }: ParseEndpointOptions = {},
): Endpoint {
  const [method, url] = parseEndpointTemplate(template, params);

  if (json != null) {
    body = JSON.stringify(json);
    headers = { ...headers, 'content-type': 'application/json' };
  }

  return {
    body,
    method,
    url: baseURL + url,
    headers: { ...headers },
  };
}
