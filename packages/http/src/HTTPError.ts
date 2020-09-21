import { Endpoint } from './utils/parseEndpoint';

export class HTTPError extends Error {
  response: Response;
  endpoint: Endpoint;

  constructor(endpoint: Endpoint, response: Response) {
    super(response.statusText || String(response.status));
    this.name = 'HTTPError';
    this.endpoint = endpoint;
    this.response = response;
  }
}
