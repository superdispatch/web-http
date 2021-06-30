import { HTTPEndpoint } from './HTTPEndpoint';

export class HTTPError extends Error {
  response: Response;
  endpoint: HTTPEndpoint;

  constructor(endpoint: HTTPEndpoint, response: Response) {
    super(response.statusText || String(response.status));
    this.name = 'HTTPError';
    this.endpoint = endpoint;
    this.response = response;
  }
}
