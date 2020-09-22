import * as api from '..';

test('public api', () => {
  expect(api).toMatchInlineSnapshot(`
    Object {
      "HTTPError": [Function],
      "createHTTP": [Function],
      "parseHTTPEndpoint": [Function],
      "parseURITemplate": [Function],
    }
  `);
});
