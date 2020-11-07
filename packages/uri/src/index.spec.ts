import * as api from './index';

test('public api', () => {
  expect(api).toMatchInlineSnapshot(`
    Object {
      "normalizeURL": [Function],
      "parseURITemplate": [Function],
    }
  `);
});
