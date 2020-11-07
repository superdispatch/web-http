import { Response } from 'node-fetch';

import { createHTTP } from './HTTP';
import { HTTPError } from './HTTPError';

beforeEach(() => {
  mockFetch();
});

function mockFetch(
  fn: (input: string, init?: RequestInit) => Promise<Response> = (
    input,
    init,
  ) =>
    Promise.resolve(
      new Response(JSON.stringify({ input, init }), { url: input }),
    ),
) {
  global.fetch = fn as any;
}

test('basic', async () => {
  const { request, requestJSON } = createHTTP();

  await expect(request('/users')).resolves.toMatchObject({
    ok: true,
    url: '/users',
    status: 200,
    statusText: 'OK',
  });

  await expect(requestJSON('/users')).resolves.toEqual({
    input: '/users',
    init: { headers: {}, method: 'GET' },
  });
});

test('error', async () => {
  const { request, requestJSON } = createHTTP();

  mockFetch((input) =>
    Promise.resolve(new Response('Invalid Token', { status: 401, url: input })),
  );

  const errorMatcher = {
    name: 'HTTPError',
    message: 'Unauthorized',
    endpoint: { url: '/users', method: 'GET', headers: {} },
    response: { ok: false, status: 401, statusText: 'Unauthorized' },
  };

  const response1 = request('/users');
  await expect(response1).rejects.toBeInstanceOf(HTTPError);
  await expect(response1).rejects.toMatchObject(errorMatcher);

  const response2 = requestJSON('/users');
  await expect(response2).rejects.toBeInstanceOf(HTTPError);
  await expect(response2).rejects.toMatchObject(errorMatcher);
});

test('unknown error status code', async () => {
  const { request, requestJSON } = createHTTP();

  mockFetch((input) =>
    Promise.resolve(new Response('Invalid Token', { status: 999, url: input })),
  );

  const errorMatcher = {
    name: 'HTTPError',
    message: '999',
    endpoint: { url: '/users', method: 'GET', headers: {} },
    response: { ok: false, status: 999, statusText: undefined },
  };

  await expect(request('/users')).rejects.toMatchObject(errorMatcher);
  await expect(requestJSON('/users')).rejects.toMatchObject(errorMatcher);
});

test('options.fetch', async () => {
  const fetch = jest.fn(global.fetch);
  const globalFetch = jest.spyOn(global, 'fetch');

  const { request, requestJSON } = createHTTP({ fetch });

  expect(fetch).not.toHaveBeenCalled();
  expect(globalFetch).not.toHaveBeenCalled();

  await expect(request('/users')).resolves.toMatchObject({
    ok: true,
    status: 200,
    url: '/users',
  });

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(globalFetch).not.toHaveBeenCalled();

  await expect(requestJSON('/users')).resolves.toBeDefined();

  expect(fetch).toHaveBeenCalledTimes(2);
  expect(globalFetch).not.toHaveBeenCalled();
});

test('options.baseURL', async () => {
  const { request, requestJSON } = createHTTP({ baseURL: '/api' });

  await expect(request('/users')).resolves.toMatchObject({
    url: '/api/users',
  });

  await expect(requestJSON('/users')).resolves.toMatchObject({
    input: '/api/users',
  });

  await expect(
    request('/users', { baseURL: 'https://example.com/api' }),
  ).resolves.toMatchObject({ url: 'https://example.com/api/users' });

  await expect(
    requestJSON('/users', { baseURL: 'https://example.com/api' }),
  ).resolves.toMatchObject({ input: 'https://example.com/api/users' });
});

test.each([
  [undefined, undefined, '/users'],
  ['/api', undefined, '/api/users'],
  [undefined, 'https://example.com', 'https://example.com/users'],
  ['/api', 'https://example.com', 'https://example.com/users'],
])(
  'options.baseURL: %p + %p -> %p',
  async (defaultBaseURL, requestBaseURL, input) => {
    const { request, requestJSON } = createHTTP({
      baseURL: defaultBaseURL,
    });

    const response = await request('/users', { baseURL: requestBaseURL });
    await expect(response.json()).resolves.toMatchObject({ input });

    await expect(
      requestJSON('/users', { baseURL: requestBaseURL }),
    ).resolves.toMatchObject({ input });
  },
);

test.each([
  [undefined, undefined, {}],
  [{ authorization: 'Token foo' }, undefined, { authorization: 'Token foo' }],
  [undefined, { Authorization: 'Token bar' }, { Authorization: 'Token bar' }],
  [
    { authorization: 'Token foo' },
    { Authorization: 'Token bar' },
    { authorization: 'Token foo', Authorization: 'Token bar' },
  ],
  [
    { authorization: 'Token foo' },
    { authorization: 'Token bar' },
    { authorization: 'Token bar' },
  ],
])(
  'options.headers: %p + %p -> %p',
  async (defaultHeaders, requestHeaders, headers) => {
    const { request, requestJSON } = createHTTP({
      headers: defaultHeaders,
    });

    const response = await request('/users', { headers: requestHeaders });
    await expect(response.json()).resolves.toMatchObject({ init: { headers } });

    await expect(
      requestJSON('/users', { headers: requestHeaders }),
    ).resolves.toMatchObject({ init: { headers } });
  },
);

test('options.body', async () => {
  const { request, requestJSON } = createHTTP();

  const response = await request('/users', { body: 'foo' });
  await expect(response.json()).resolves.toMatchObject({
    init: { body: 'foo' },
  });

  await expect(requestJSON('/users', { body: 'foo' })).resolves.toMatchObject({
    init: { body: 'foo' },
  });
});

test('options.json', async () => {
  const { request, requestJSON } = createHTTP();

  const response = await request('/users', { json: { foo: 1 } });
  await expect(response.json()).resolves.toMatchObject({
    init: { body: '{"foo":1}' },
  });

  await expect(
    requestJSON('/users', { json: { foo: 1 } }),
  ).resolves.toMatchObject({
    init: { body: '{"foo":1}' },
  });
});

test('options.abortSignal', async () => {
  const { request, requestJSON } = createHTTP();

  const abortSignals: Array<null | undefined | AbortSignal> = [];

  mockFetch((input, init) => {
    abortSignals.push(init?.signal);

    return Promise.resolve(new Response(JSON.stringify(input)));
  });

  expect(abortSignals).toHaveLength(0);

  await expect(request('/users')).resolves.toBeDefined();

  expect(abortSignals).toHaveLength(1);
  expect(abortSignals[0]).toBeUndefined();

  const abortController1 = new AbortController();
  await expect(
    request('/users', { signal: abortController1.signal }),
  ).resolves.toBeDefined();

  expect(abortSignals).toHaveLength(2);
  expect(abortSignals[1]).toBe(abortController1.signal);

  await expect(requestJSON('/users')).resolves.toBeDefined();

  expect(abortSignals).toHaveLength(3);
  expect(abortSignals[2]).toBeUndefined();

  const abortController2 = new AbortController();
  await expect(
    requestJSON('/users', { signal: abortController2.signal }),
  ).resolves.toBeDefined();

  expect(abortSignals).toHaveLength(4);
  expect(abortSignals[3]).toBe(abortController2.signal);
});

test('options.parseJSON', async () => {
  const { requestJSON } = createHTTP();
  const parseJSON = jest.fn((json) => JSON.parse(json).input);

  expect(parseJSON).not.toHaveBeenCalled();

  await expect(requestJSON('/users', { parseJSON })).resolves.toBe('/users');

  expect(parseJSON).toHaveBeenCalledTimes(1);

  await expect(requestJSON('/users/{id}', { id: 1, parseJSON })).resolves.toBe(
    '/users/1',
  );

  expect(parseJSON).toHaveBeenCalledTimes(2);
});
