import { parseEndpoint } from '../parseEndpoint';

test('basic', () => {
  expect(
    parseEndpoint<{ id: number }>('/users/{id}/comments', { id: 1 }),
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
  expect(parseEndpoint('/users', undefined, { baseURL })).toMatchObject({
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
  expect(parseEndpoint('/users', undefined, { headers })).toMatchObject({
    headers: result,
  });
});

test.each([
  [undefined, undefined],
  ['text', 'text'],
])('body: %p -> %p', (body, result) => {
  expect(parseEndpoint('/users', undefined, { body })).toMatchObject({
    body: result,
  });
});

test.each([
  [undefined, undefined],
  ['text', '"text"'],
  [{ object: true }, '{"object":true}'],
  [['arr', 'ay'], '["arr","ay"]'],
])('json: %p -> %p', (json, result) => {
  expect(parseEndpoint('/users', undefined, { json })).toMatchObject({
    body: result,
  });
});

test.each([
  ['/users', 'GET'],
  ['GET /users', 'GET'],
  ['POST /users', 'POST'],
  ['post /users', 'POST'],
  ['CHICKEN /users', 'CHICKEN'],
])('method parsing: %p -> %p', (endpoint, method) => {
  expect(parseEndpoint(endpoint)).toMatchObject({ method });
});

test.each([
  [{}, '/users'],
  [{ page: 2 }, '/users?page=2'],
  [{ page_size: 5 }, '/users?page_size=5'],
  [{ page: 2, page_size: 5 }, '/users?page=2&page_size=5'],
])('query expansion: %p -> %p', (params, url) => {
  expect(parseEndpoint('/users{?page,page_size}', params)).toMatchObject({
    url,
  });
});

test.each([
  [{}, '/users?page_size=10'],
  [{ page: 2 }, '/users?page_size=10&page=2'],
  [{ q: 'foo' }, '/users?page_size=10&q=foo'],
  [{ page: 1, q: 'foo' }, '/users?page_size=10&q=foo&page=1'],
])('query continuation: %p -> %p', (params, url) => {
  expect(parseEndpoint('/users?page_size=10{&q,page}', params)).toMatchObject({
    url,
  });
});
