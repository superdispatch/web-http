import { EndpointParams } from './utils/Endpoint';

export class HTTPError extends Error {
  response: Response;
  endpoint: EndpointParams;

  constructor(endpoint: EndpointParams, response: Response) {
    super(response.statusText || response.status);
    this.name = 'HTTPError';
    this.endpoint = endpoint;
    this.response = response;
  }
}
