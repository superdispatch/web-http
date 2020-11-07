import { parseHTTPEndpoint } from '@superdispatch/http';
import { URITemplateParams } from '@superdispatch/uri';

import {
  HTTPResourceFetcherArgs,
  HTTPResourceFetcherOptions,
  HTTPResourceInput,
  HTTPResourceKey,
} from '../types';

export function inputToArgs<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceFetcherArgs<TParams> {
  return typeof input === 'string' ? [input] : input;
}

export function argsToKey<TParams extends URITemplateParams>(
  template: string,
  options?: HTTPResourceFetcherOptions<TParams>,
): HTTPResourceKey {
  const { url, body, method } = parseHTTPEndpoint(template, options);

  return [
    method,
    url,
    typeof body == 'string' ? body : undefined,
    options?.key,
  ];
}

export function inputToKey<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceKey {
  const [template, options] = inputToArgs(input);

  return argsToKey(template, options);
}
