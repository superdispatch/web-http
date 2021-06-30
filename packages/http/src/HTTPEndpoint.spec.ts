import {
  HTTPEndpoint,
  HTTPEndpointInput,
  HTTPEndpointTemplate,
  parseHTTPEndpoint,
} from './HTTPEndpoint';

test('basic', () => {
  expect(
    parseHTTPEndpoint<{ id: number }>(['GET /users/{id}/comments', { id: 1 }]),
  ).toEqual({ method: 'GET', url: '/users/1/comments' });
});

test.each<[HTTPEndpointInput, HTTPEndpoint]>([
  ['GET /users', { method: 'GET', url: '/users' }],
  [['GET /users/{id}', { id: 1 }], { method: 'GET', url: '/users/1' }],
  [['GET /users/{id}', {}], { method: 'GET', url: '/users/' }],
  [['GET /users{/id}', {}], { method: 'GET', url: '/users' }],
  [['GET /users{/id}', { id: 1 }], { method: 'GET', url: '/users/1' }],
])('input: %j -> %j', (input, expected) => {
  expect(parseHTTPEndpoint(input)).toEqual(expected);
});

test.each<[HTTPEndpointTemplate, HTTPEndpoint]>([
  ['GET /users', { method: 'GET', url: '/users' }],
  ['POST /users', { method: 'POST', url: '/users' }],
  ['PUT /users', { method: 'PUT', url: '/users' }],
  ['PATCH /users', { method: 'PATCH', url: '/users' }],
  ['DELETE /users', { method: 'DELETE', url: '/users' }],
])('method: %p -> %j', (input, expected) => {
  expect(parseHTTPEndpoint(input)).toMatchObject(expected);
});

test.each<[string, HTTPEndpoint, string]>([
  [
    '/users',
    { method: 'GET', url: '/users' },
    '[HTTP] "template" should have a method, received "/users".',
  ],
  [
    'get /users',
    { method: 'GET', url: '/users' },
    '[HTTP] "template" method should be in uppercase, received "get" in "get /users".',
  ],

  [
    'CHICKEN /users',
    // @ts-expect-error should be accepted.
    { method: 'CHICKEN', url: '/users' },
    '[HTTP] "template" has unknown method "CHICKEN" in "CHICKEN /users".',
  ],

  [
    'GET users',
    { method: 'GET', url: '/users' },
    '[HTTP] "template" should start with slash, received "GET users".',
  ],
])('invalid input: %p -> %p, %p', (input, expected, error) => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation();

  // @ts-expect-error should normalize input method.
  expect(parseHTTPEndpoint(input)).toMatchObject(expected);
  expect(consoleError).toHaveBeenCalledTimes(1);
  expect(consoleError).toHaveBeenLastCalledWith(error);
});

test.each<[string, HTTPEndpointInput, string]>([
  ['/api', 'GET /users', '/api/users'],
  ['https://example.com', 'GET /users', 'https://example.com/users'],
  ['https://example.com/api', 'GET /users', 'https://example.com/api/users'],
  [
    'https://example.com/api/v1',
    'GET /users',
    'https://example.com/api/v1/users',
  ],
])('baseURL: %p + %p -> %p', (baseURL, input, url) => {
  expect(parseHTTPEndpoint(input, { baseURL })).toMatchObject({
    url,
  });
});

test.each<[string, HTTPEndpointInput, string, string]>([
  [
    '/api/',
    'GET /users',
    '/api/users',
    '[HTTP] "baseURL" option should not end with slash, received "/api/"',
  ],
  [
    'https://example.com/',
    'GET /users',
    'https://example.com/users',
    '[HTTP] "baseURL" option should not end with slash, received "https://example.com/"',
  ],
  [
    'https://example.com/api////',
    'GET /users',
    'https://example.com/api/users',
    '[HTTP] "baseURL" option should not end with slash, received "https://example.com/api////"',
  ],
])('invalid baseURL: %p + %p -> %s', (baseURL, input, url, error) => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation();

  expect(parseHTTPEndpoint(input, { baseURL })).toMatchObject({ url });
  expect(consoleError).toHaveBeenCalledTimes(1);
  expect(consoleError).toHaveBeenLastCalledWith(error);
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
  expect(parseHTTPEndpoint('GET /users', { headers })).toMatchObject(expected);
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
  [{}, '/users'],
  [{ page: 2 }, '/users?page=2'],
  [{ page_size: 5 }, '/users?page_size=5'],
  [{ page: 2, page_size: 5 }, '/users?page=2&page_size=5'],
])('query expansion: %p -> %p', (params, url) => {
  expect(
    parseHTTPEndpoint<{ page?: number; page_size?: number }>([
      'GET /users{?page,page_size}',
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
      'GET /users?page_size=10{&q,page}',
      params,
    ]),
  ).toMatchObject({ url });
});
