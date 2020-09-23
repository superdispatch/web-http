import { act, renderHook } from '@testing-library/react-hooks';
import { cache } from 'swr';

import {
  HTTPInfiniteResourceParamFactory,
  useHTTPInfiniteResource,
} from '../HTTPInfiniteResource';
import { HTTPResourceFetcherArgs, HTTPResourceInput } from '../types';

let fetcher: jest.Mock;

beforeEach(() => {
  cache.clear();

  fetcher = jest.fn(
    (...args: any[]) =>
      new Promise((resolve) => setTimeout(() => resolve(args), 100)),
  );
});

test.each<
  [
    HTTPResourceInput<any>,
    Array<HTTPResourceFetcherArgs<any>>,
    HTTPInfiniteResourceParamFactory<any>,
  ]
>([
  [
    '/users{?page}',
    [
      ['GET /users?page=1', {}],
      ['GET /users?page=2', {}],
      ['GET /users?page=3', {}],
      ['GET /users?page=4', {}],
      ['GET /users?page=5', {}],
    ],
    (index: number) => ({ page: index + 1 }),
  ],

  [
    ['/users{?page,page_size}', { page_size: 10 }],
    [
      ['GET /users?page=1&page_size=10', {}],
      ['GET /users?page=2&page_size=10', {}],
      ['GET /users?page=3&page_size=10', {}],
      ['GET /users?page=4&page_size=10', {}],
      ['GET /users?page=5&page_size=10', {}],
    ],
    (index: number) => ({ page: index + 1 }),
  ],

  [
    'POST /search',
    [
      ['POST /search', { body: '{"page":1}' }],
      ['POST /search', { body: '{"page":2}' }],
      ['POST /search', { body: '{"page":3}' }],
      ['POST /search', { body: '{"page":4}' }],
      ['POST /search', { body: '{"page":5}' }],
    ],
    (index: number) => ({ json: { page: index + 1 } }),
  ],

  [
    'POST /search{?page}',
    [
      ['POST /search?page=1', { body: '{"page":1}' }],
      ['POST /search?page=2', { body: '{"page":2}' }],
      ['POST /search?page=3', { body: '{"page":3}' }],
      ['POST /search?page=4', { body: '{"page":4}' }],
      ['POST /search?page=5', { body: '{"page":5}' }],
    ],
    (index: number) => ({ page: index + 1, json: { page: index + 1 } }),
  ],
])('pagination %p -> %p', async (input, args, makeParams) => {
  const { result, waitForValueToChange } = renderHook(() =>
    useHTTPInfiniteResource(input, makeParams, fetcher, {
      dedupingInterval: 10,
    }),
  );

  expect(result.current).toMatchObject({
    size: 1,
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    size: 1,
    error: undefined,
    isValidating: false,
    data: args.slice(0, 1),
  });

  for (let size = 2; size <= 5; size++) {
    void act(() => {
      void result.current.setSize(size);
    });

    expect(result.current).toMatchObject({
      size,
      error: undefined,
      isValidating: false,
      data: args.slice(0, size - 1),
    });

    await waitForValueToChange(() => result.current.isValidating);

    expect(result.current).toMatchObject({
      size,
      error: undefined,
      isValidating: true,
      data: args.slice(0, size - 1),
    });

    await waitForValueToChange(() => result.current.isValidating);

    expect(result.current).toMatchObject({
      size,
      error: undefined,
      isValidating: false,
      data: args.slice(0, size),
    });
  }
});
