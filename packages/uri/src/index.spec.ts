import * as api from './index';

test('public api', () => {
  expect(api).toMatchInlineSnapshot(`
    Object {
      "parseURITemplate": [Function],
    }
  `);
});
