import { URITemplateParams } from './utils/parseURITemplate';

export type HTTPRequestOptions = URITemplateParams;

export interface HTTP {
  request: (endpoint: string, options) => void;
}
