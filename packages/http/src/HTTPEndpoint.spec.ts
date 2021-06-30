import { parseHTTPEndpoint } from './HTTPEndpoint';

test('basic', () => {
  expect(
    parseHTTPEndpoint<{ id: number }>(['/users/{id}/comments', { id: 1 }]),
  ).toEqual({ method: 'GET', url: '/users/1/comments' });
});

test.each([
  ['/api', '/api/users'],
  ['/api/', '/api//users'],
  ['https://example.com', 'https://example.com/users'],
  ['https://example.com/api', 'https://example.com/api/users'],
  ['https://example.com/api/v1', 'https://example.com/api/v1/users'],
])('baseURL: %p -> %p', (baseURL, result) => {
  expect(parseHTTPEndpoint('/users', { baseURL })).toMatchObject({
    url: result,
  });
});

test.each([
  [undefined, {}],
  [
    { 'content-type': 'plain/text' },
    { headers: { 'content-type': 'plain/text' } },
  ],
  [
    { 'content-type': 'plain/text', 'Content-Type': 'application/json' },
    {
      headers: {
        'content-type': 'plain/text',
        'Content-Type': 'application/json',
      },
    },
  ],
])('header: %p -> %p', (headers, expected) => {
  expect(parseHTTPEndpoint('/users', { headers })).toMatchObject(expected);
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
  ['/users', 'GET', '/users'],
  ['GET /users', 'GET', '/users'],
  ['POST /users', 'POST', '/users'],
  ['post /users', 'POST', '/users'],
  ['CHICKEN /users', 'CHICKEN', '/users'],
])('method parsing: %p -> %p', (endpoint, method, url) => {
  expect(parseHTTPEndpoint(endpoint)).toMatchObject({ url, method });
});

test.each([
  [{}, '/users'],
  [{ page: 2 }, '/users?page=2'],
  [{ page_size: 5 }, '/users?page_size=5'],
  [{ page: 2, page_size: 5 }, '/users?page=2&page_size=5'],
])('query expansion: %p -> %p', (params, url) => {
  expect(
    parseHTTPEndpoint<{ page?: number; page_size?: number }>([
      '/users{?page,page_size}',
      params,
    ]),
  ).toMatchObject({ url });
});

test.each([
  [{}, '/users?page_size=10'],
  [{ page: 2 }, '/users?page_size=10&page=2'],
  [{ q: 'foo' }, '/users?page_size=10&q=foo'],
  [{ page: 1, q: 'foo' }, '/users?page_size=10&q=foo&page=1'],
])('query continuation: %p -> %p', (params, url) => {
  expect(
    parseHTTPEndpoint<{ page?: number; q?: string }>([
      '/users?page_size=10{&q,page}',
      params,
    ]),
  ).toMatchObject({ url });
});
