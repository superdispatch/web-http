import { act, renderHook } from '@testing-library/react-hooks';
import { cache } from 'swr';
import {
  clearHTTPResourceCache,
  mutateHTTPResource,
  readCachedHTTPResource,
  revalidateHTTPResource,
} from './HTTPCache';
import { useHTTPResource } from './HTTPResource';

const fetcher = (...args: any[]) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve(args);
    }, 100),
  );

beforeEach(() => {
  cache.clear();
});

test('revalidation', async () => {
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

  act(() => {
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

test('mutation', async () => {
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

  act(() => {
    void mutateHTTPResource<any[]>(
      ['/users/{id}', { id: 1 }],
      (prev = []) => [...prev, { foo: 'bar' }],
      false,
    );
  });

  expect(result.current).toMatchObject({
    error: undefined,
    isValidating: false,
    data: ['/users/{id}', { id: 1 }, { foo: 'bar' }],
  });

  act(() => {
    void mutateHTTPResource<any[]>(
      ['/users/{id}', { id: 1 }],
      (prev = []) => [...prev, { bar: 'baz' }],
      true,
    );
  });

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

test('clear', async () => {
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

test('read', async () => {
  const { result, waitFor, rerender } = renderHook(
    ({ id }) => useHTTPResource(['/users/{id}', { id }], fetcher),
    { initialProps: { id: 1 } },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  expect(readCachedHTTPResource(['/users/{id}', { id: 1 }])).toBeUndefined();
  expect(readCachedHTTPResource(['/users/{id}', { id: 2 }])).toBeUndefined();

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 1 }],
    });
  });

  expect(readCachedHTTPResource(['/users/{id}', { id: 1 }])).toEqual([
    '/users/{id}',
    { id: 1 },
  ]);

  expect(readCachedHTTPResource(['/users/{id}', { id: 2 }])).toBeUndefined();

  rerender({ id: 2 });

  expect(result.current).toMatchObject({
    data: undefined,
    error: undefined,
    isValidating: true,
  });

  expect(readCachedHTTPResource(['/users/{id}', { id: 1 }])).toEqual([
    '/users/{id}',
    { id: 1 },
  ]);

  expect(readCachedHTTPResource(['/users/{id}', { id: 2 }])).toBeUndefined();

  await waitFor(() => {
    expect(result.current).toMatchObject({
      error: undefined,
      isValidating: false,
      data: ['/users/{id}', { id: 2 }],
    });
  });

  expect(readCachedHTTPResource(['/users/{id}', { id: 1 }])).toEqual([
    '/users/{id}',
    { id: 1 },
  ]);

  expect(readCachedHTTPResource(['/users/{id}', { id: 2 }])).toEqual([
    '/users/{id}',
    { id: 2 },
  ]);
});
