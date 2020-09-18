import { URITemplate } from '../URITemplate';

const context = {
  count: ['one', 'two', 'three'],
  dom: ['example.com'],
  dub: 'me/too',
  hello: 'Hello World!',
  half: '50%',
  var: 'value',
  who: 'fred',
  base: 'http://example.com/home/',
  path: '/foo/bar',
  list: ['red', 'green', 'blue'],
  keys: [
    ['semi', ';'],
    ['dot', '.'],
    ['comma', ','],
  ],
  v: '6',
  x: '1024',
  y: '768',
  empty: '',
  empty_keys: [],
  undef: undefined,
} as const;

/**
 * @see https://tools.ietf.org/html/rfc6570#section-3.2.2
 */
describe('simple string expansion', () => {
  test.each`
    template         | output
    ${'{hello}'}     | ${'Hello%20World%21'}
    ${'{half}'}      | ${'50%25'}
    ${'O{empty}X'}   | ${'OX'}
    ${'O{undef}X'}   | ${'OX'}
    ${'{x,y}'}       | ${'1024,768'}
    ${'{x,hello,y}'} | ${'1024,Hello%20World%21,768'}
    ${'?{x,empty}'}  | ${'?1024,'}
    ${'?{x,undef}'}  | ${'?1024'}
    ${'?{undef,y}'}  | ${'?768'}
    ${'{list}'}      | ${'red,green,blue'}
    ${'{keys}'}      | ${'semi,%3B,dot,.,comma,%2C'}
  `('$template -> $output', ({ template, output }) => {
    const uriTemplate = new URITemplate(template);

    expect(uriTemplate.expand(context)).toBe(output);
  });
});

/**
 * @see https://tools.ietf.org/html/rfc6570#section-3.2.8
 */
describe('form-style query expansion', () => {
  test.each`
    template          | output
    ${'{?who}'}       | ${'?who=fred'}
    ${'{?half}'}      | ${'?half=50%25'}
    ${'{?empty}'}     | ${'?empty='}
    ${'{?undef}'}     | ${''}
    ${'{?x,y}'}       | ${'?x=1024&y=768'}
    ${'{?x,y,empty}'} | ${'?x=1024&y=768&empty='}
    ${'{?x,y,undef}'} | ${'?x=1024&y=768'}
    ${'{?list}'}      | ${'?list=red,green,blue'}
    ${'{?keys}'}      | ${'?keys=semi,%3B,dot,.,comma,%2C'}
  `('$template -> $output', ({ template, output }) => {
    const uriTemplate = new URITemplate(template);

    expect(uriTemplate.expand(context)).toBe(output);
  });
});

/**
 * @see https://tools.ietf.org/html/rfc6570#section-3.2.9
 */
describe('form-style query continuation', () => {
  test.each`
    template            | output
    ${'{&who}'}         | ${'&who=fred'}
    ${'{&half}'}        | ${'&half=50%25'}
    ${'{&empty}'}       | ${'&empty='}
    ${'{&undef}'}       | ${''}
    ${'?fixed=yes{&x}'} | ${'?fixed=yes&x=1024'}
    ${'{&x,y,empty}'}   | ${'&x=1024&y=768&empty='}
    ${'{&x,y,undef}'}   | ${'&x=1024&y=768'}
    ${'{&list}'}        | ${'&list=red,green,blue'}
    ${'{&keys}'}        | ${'&keys=semi,%3B,dot,.,comma,%2C'}
  `('$template -> $output', ({ template, output }) => {
    const uriTemplate = new URITemplate(template);

    expect(uriTemplate.expand(context)).toBe(output);
  });
});
