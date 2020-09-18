import { URITemplate, URITemplateParams } from './URITemplate';

const METHOD_PATTERN = /^([\w]+) (.+)/;

function parseMethod(url: string): [method: string, url: string] {
  const matches = METHOD_PATTERN.exec(url);
  let method = 'GET';

  if (matches) {
    url = matches[2];
    method = matches[1].toUpperCase();
  }

  return [method.toUpperCase(), url];
}

export interface EndpointConstructorOptions<T extends URITemplateParams> {
  baseURL?: string;
  defaults?: Partial<T>;
  headers?: Record<string, string>;
}

export interface EndpointParseOptions {
  body?: unknown;
  baseURL?: string;
  headers?: Record<string, string>;
}

export interface EndpointParams {
  url: string;
  body?: unknown;
  method: string;
  headers: Record<string, string>;
}

export class Endpoint<T extends URITemplateParams> {
  protected url: string;
  protected method: string;
  protected baseURL?: string;
  protected defaults: Partial<T>;
  protected template: URITemplate<T>;
  protected headers: Record<string, string>;

  constructor(
    url: string,
    { headers, baseURL, defaults }: EndpointConstructorOptions<T> = {},
  ) {
    [this.method, this.url] = parseMethod(url);

    this.baseURL = baseURL;
    this.headers = { ...headers };
    this.defaults = { ...defaults };
    this.template = new URITemplate(this.url);
  }

  parse(
    params: T,
    { body, headers, baseURL = this.baseURL }: EndpointParseOptions = {},
  ): EndpointParams {
    let url = this.template.expand({ ...this.defaults, ...params });

    if (baseURL) {
      url = baseURL + url;
    }

    return {
      url,
      body,
      method: this.method,
      headers: { ...this.headers, ...headers },
    };
  }
}
