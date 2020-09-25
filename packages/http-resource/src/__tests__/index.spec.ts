import * as api from '../index';

test('public api', () => {
  expect(api).toMatchInlineSnapshot(`
    Object {
      "clearHTTPResourceCache": [Function],
      "mutateHTTPResource": [Function],
      "revalidateHTTPResource": [Function],
      "useHTTPInfiniteResource": [Function],
      "useHTTPResource": [Function],
    }
  `);
});
