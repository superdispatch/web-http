import { Endpoint } from '../Endpoint';

test('basic', () => {
  const endpoint = new Endpoint<{ id: number }>('/users/{id}/comments');

  expect(endpoint.parse({ id: 1 })).toEqual({
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
  const endpoint = new Endpoint('/users', { baseURL });

  expect(endpoint.parse({})).toMatchObject({ url: result });
});

test.each([
  [undefined, undefined, {}],
  [{ foo: '1' }, undefined, { foo: '1' }],
  [undefined, { bar: '2' }, { bar: '2' }],
  [{ foo: '1' }, { bar: '2' }, { foo: '1', bar: '2' }],
  [{ foo: '1' }, { foo: '2' }, { foo: '2' }],
])('header: %p + %p -> %p', (defaults, headers, result) => {
  const endpoint = new Endpoint('/users', { headers: defaults });

  expect(endpoint.parse({}, { headers })).toMatchObject({ headers: result });
});

test.each([
  [undefined, undefined],
  ['text', 'text'],
  [{ object: true }, { object: true }],
  [
    ['arr', 'ay'],
    ['arr', 'ay'],
  ],
])('body: %p -> %p', (body, result) => {
  const endpoint = new Endpoint('/users');

  expect(endpoint.parse({}, { body })).toMatchObject({ body: result });
});

test.each([
  ['/users', 'GET'],
  ['GET /users', 'GET'],
  ['POST /users', 'POST'],
  ['post /users', 'POST'],
  ['CHICKEN /users', 'CHICKEN'],
])('method parsing: %p -> %p', (url, method) => {
  const endpoint = new Endpoint(url);

  expect(endpoint.parse({})).toMatchObject({ method });
});

test.each([
  [{}, '/users'],
  [{ page: 2 }, '/users?page=2'],
  [{ page_size: 5 }, '/users?page_size=5'],
  [{ page: 2, page_size: 5 }, '/users?page=2&page_size=5'],
])('query expansion: %p -> %p', (params, url) => {
  const endpoint = new Endpoint('GET /users{?page,page_size}');

  expect(endpoint.parse(params)).toMatchObject({ url });
});

test.each([
  [{}, '/users?page_size=10'],
  [{ page: 2 }, '/users?page_size=10&page=2'],
  [{ q: 'foo' }, '/users?page_size=10&q=foo'],
  [{ page: 1, q: 'foo' }, '/users?page_size=10&q=foo&page=1'],
])('query continuation: %p -> %p', (params, url) => {
  const endpoint = new Endpoint('/users?page_size=10{&q,page}');

  expect(endpoint.parse(params)).toMatchObject({ url });
});

test.each([
  [{}, {}, '/users'],
  [{ page_size: 10 }, {}, '/users?page_size=10'],
  [{}, { page_size: 5 }, '/users?page_size=5'],
  [{ page_size: 10 }, { page_size: 5 }, '/users?page_size=5'],
])('defaults: %p + %p -> %p', (defaults, params, url) => {
  const endpoint = new Endpoint('/users{?page_size}', { defaults });

  expect(endpoint.parse(params)).toMatchObject({ url });
});
