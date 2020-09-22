import { act, renderHook } from '@testing-library/react-hooks';
import { cloneDeep } from 'lodash';
import { cache } from 'swr';

import {
  clearHTTPResourceCache,
  mutateHTTPResource,
  revalidateHTTPResource,
  useHTTPResource,
} from '../HTTPResource';

let fetcher: jest.Mock;

beforeEach(() => {
  cache.clear();
  fetcher = jest.fn(
    (...args: any[]) =>
      new Promise((resolve) => setTimeout(() => resolve(args), 100)),
  );
});

test('basic', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useHTTPResource('/users', fetcher),
  );

  expect(result.current).toMatchInlineSnapshot(`
    Object {
      "data": undefined,
      "error": undefined,
      "isValidating": true,
      "mutate": [Function],
      "revalidate": [Function],
    }
  `);

  await waitForNextUpdate();

  expect(result.current).toMatchInlineSnapshot(`
    Object {
      "data": Array [
        "/users",
        undefined,
      ],
      "error": undefined,
      "isValidating": false,
      "mutate": [Function],
      "revalidate": [Function],
    }
  `);
});

test.each([
  ['/users/{id}', { id: 1 }, { id: 2 }],
  ['POST /users/search', { body: 'foo' }, { body: 'bar' }],
  ['POST /users/search', { json: { name: 'foo' } }, { json: { name: 'bar' } }],
])('dynamic key: %p [%p, %p]', async (template, params1, params2) => {
  const { result, rerender, waitForValueToChange } = renderHook(
    (params) =>
      useHTTPResource([template, params], fetcher, {
        // We have to disable deduping for this test.
        dedupingInterval: 10,
      }),
    { initialProps: cloneDeep(params1) },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: [template, params1],
  });

  //
  // Use second params.

  rerender(cloneDeep(params2));

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: [template, params2],
  });

  //
  // Use first params again.
  rerender(cloneDeep(params1));

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: [template, params1],
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: true,
    data: [template, params1],
  });

  // Reuse first params.
  rerender(cloneDeep(params1));

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: true,
    data: [template, params1],
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: [template, params1],
  });
});

test('skip', async () => {
  const { result, rerender, waitForValueToChange } = renderHook(
    ({ skip }) => useHTTPResource('/users', fetcher, { skip }),
    { initialProps: { skip: true } },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: false,
  });

  rerender({ skip: false });

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: ['/users', undefined],
  });

  rerender({ skip: true });

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: false,
  });
});

test('outside revalidation', async () => {
  const { result, waitForValueToChange } = renderHook(
    ({ id }) => useHTTPResource(['/users/{id}', { id }], fetcher),
    { initialProps: { id: 1 } },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: ['/users/{id}', { id: 1 }],
  });

  void act(() => {
    void revalidateHTTPResource(['/users/{id}', { id: 1 }]);
  });

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: true,
    data: ['/users/{id}', { id: 1 }],
  });

  await waitForValueToChange(() => result.current.isValidating);

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: ['/users/{id}', { id: 1 }],
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
});

test('outside mutation', async () => {
  const { result, waitFor } = renderHook(
    ({ id }) => useHTTPResource(['/users/{id}', { id }], fetcher),
    { initialProps: { id: 1 } },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 1 }],
    });
  });

  void mutateHTTPResource<any[]>(
    ['/users/{id}', { id: 1 }],
    (prev) => [...prev, { foo: 'bar' }],
    false,
  );

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: ['/users/{id}', { id: 1 }],
  });

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 1 }, { foo: 'bar' }],
    });
  });

  void mutateHTTPResource<any[]>(
    ['/users/{id}', { id: 1 }],
    (prev) => [...prev, { bar: 'baz' }],
    true,
  );

  // It should asynchronously update value in cache first.
  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: true,
      data: ['/users/{id}', { id: 1 }, { foo: 'bar' }, { bar: 'baz' }],
    });
  });

  // Then it will rewrite value from the network.
  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 1 }],
    });
  });
});

test('cache clear', async () => {
  const { result, waitFor, rerender } = renderHook(
    ({ id }) => useHTTPResource(['/users/{id}', { id }], fetcher),
    { initialProps: { id: 1 } },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 1 }],
    });
  });

  rerender({ id: 2 });

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 2 }],
    });
  });

  clearHTTPResourceCache();

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: ['/users/{id}', { id: 2 }],
  });

  rerender({ id: 1 });

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: true,
  });

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 1 }],
    });
  });

  rerender({ id: 2 });

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: true,
  });

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 2 }],
    });
  });
});
