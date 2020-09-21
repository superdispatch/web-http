import { renderHook } from '@testing-library/react-hooks';

import { useHTTPResource } from '../HTTPResource';

test('basic', async () => {
  const fetcher = jest.fn((template: any, options: any) =>
    Promise.resolve([template, options]),
  );

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

test('dynamic headers', async () => {
  const fetcher = jest.fn((template: any, options: any) =>
    Promise.resolve([template, options]),
  );

  const { result, rerender, waitForNextUpdate } = renderHook(
    ({ token }) =>
      useHTTPResource(
        ['/users', { headers: { authorization: `Token ${token}` } }],
        fetcher,
      ),
    { initialProps: { token: 'foo' } },
  );

  expect(result.current).toMatchObject({
    data: undefined,
    isValidating: true,
  });

  await waitForNextUpdate();

  expect(result.current).toMatchObject({
    isValidating: false,
    data: ['/users', { headers: { authorization: 'Token foo' } }],
  });

  rerender({ token: 'foo' });

  expect(result.current).toMatchObject({
    isValidating: false,
    data: ['/users', { headers: { authorization: 'Token foo' } }],
  });

  rerender({ token: 'bar' });

  expect(result.current).toMatchObject({
    data: undefined,
    isValidating: true,
  });

  await waitForNextUpdate();

  expect(result.current).toMatchObject({
    isValidating: false,
    data: ['/users', { headers: { authorization: 'Token bar' } }],
  });

  rerender({ token: 'bar' });

  expect(result.current).toMatchObject({
    isValidating: false,
    data: ['/users', { headers: { authorization: 'Token bar' } }],
  });
});
