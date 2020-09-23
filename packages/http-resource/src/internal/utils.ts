import { parseHTTPEndpoint, URITemplateParams } from '@superdispatch/http';

import {
  HTTPResourceFetcherArgs,
  HTTPResourceInput,
  HTTPResourceKey,
} from '../types';

export function inputToArgs<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceFetcherArgs<TParams> {
  return typeof input === 'string' ? [input] : input;
}

export function argsToKey<TParams extends URITemplateParams>(
  args: HTTPResourceFetcherArgs<TParams>,
): HTTPResourceKey {
  const { url, body, method } = parseHTTPEndpoint(...args);

  return [method, url, typeof body == 'string' ? body : undefined];
}

export function inputToKey<TParams extends URITemplateParams>(
  input: HTTPResourceInput<TParams>,
): HTTPResourceKey {
  return argsToKey(inputToArgs(input));
}
