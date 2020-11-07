import { parseHTTPEndpoint } from './parseHTTPEndpoint';

test('basic', () => {
  expect(
    parseHTTPEndpoint<{ id: number }>('/users/{id}/comments', { id: 1 }),
  ).toEqual({
    headers: {},
    method: 'GET',
    url: '/users/1/comments',
  });
});

test.each([
  ['/api', '/api/users'],
  ['/api/', '/api//users'],
  ['http://example.com', 'http://example.com/users'],
  ['http://example.com/api', 'http://example.com/api/users'],
  ['http://example.com/api/v1', 'http://example.com/api/v1/users'],
])('baseURL: %p -> %p', (baseURL, result) => {
  expect(parseHTTPEndpoint('/users', { baseURL })).toMatchObject({
    url: result,
  });
});

test.each([
  [undefined, {}],
  [{ 'content-type': 'plain/text' }, { 'content-type': 'plain/text' }],
  [
    { 'content-type': 'plain/text', 'Content-Type': 'application/json' },
    { 'content-type': 'plain/text', 'Content-Type': 'application/json' },
  ],
])('header: %p -> %p', (headers, result) => {
  expect(parseHTTPEndpoint('/users', { headers })).toMatchObject({
    headers: result,
  });
});

test.each([['text', 'text']])('body: %p -> %p', (body, result) => {
  expect(parseHTTPEndpoint('POST /users', { body })).toMatchObject({
    body: result,
  });
});

test.each([
  ['text', '"text"'],
  [{ object: true }, '{"object":true}'],
  [['arr', 'ay'], '["arr","ay"]'],
])('json: %p -> %p', (json, result) => {
  expect(parseHTTPEndpoint('POST /users', { json })).toMatchObject({
    body: result,
    headers: { 'content-type': 'application/json' },
  });
});

test.each([
  ['/users', 'GET'],
  ['GET /users', 'GET'],
  ['POST /users', 'POST'],
  ['post /users', 'POST'],
  ['CHICKEN /users', 'CHICKEN'],
])('method parsing: %p -> %p', (endpoint, method) => {
  expect(parseHTTPEndpoint(endpoint)).toMatchObject({ method });
});

test.each([
  [{}, '/users'],
  [{ page: 2 }, '/users?page=2'],
  [{ page_size: 5 }, '/users?page_size=5'],
  [{ page: 2, page_size: 5 }, '/users?page=2&page_size=5'],
])('query expansion: %p -> %p', (params, url) => {
  expect(
    parseHTTPEndpoint<{ page?: number; page_size?: number }>(
      '/users{?page,page_size}',
      params,
    ),
  ).toMatchObject({ url });
});

test.each([
  [{}, '/users?page_size=10'],
  [{ page: 2 }, '/users?page_size=10&page=2'],
  [{ q: 'foo' }, '/users?page_size=10&q=foo'],
  [{ page: 1, q: 'foo' }, '/users?page_size=10&q=foo&page=1'],
])('query continuation: %p -> %p', (params, url) => {
  expect(
    parseHTTPEndpoint<{ page?: number; q?: string }>(
      '/users?page_size=10{&q,page}',
      params,
    ),
  ).toMatchObject({ url });
});
