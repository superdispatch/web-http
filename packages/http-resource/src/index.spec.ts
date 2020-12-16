import * as api from './index';

test('public api', () => {
  expect(api).toMatchInlineSnapshot(`
    Object {
      "clearHTTPResourceCache": [Function],
      "mutateHTTPResource": [Function],
      "readCachedHTTPResource": [Function],
      "revalidateHTTPResource": [Function],
      "useHTTPInfiniteResource": [Function],
      "useHTTPResource": [Function],
    }
  `);
});
