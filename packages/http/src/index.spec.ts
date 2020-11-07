import * as api from './index';

test('public api', () => {
  expect(api).toMatchInlineSnapshot(`
    Object {
      "HTTPError": [Function],
      "createHTTP": [Function],
      "parseHTTPEndpoint": [Function],
    }
  `);
});
