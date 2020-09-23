import { parseURITemplate } from '../parseURITemplate';

const context = {
  email: 'john.doe@example.com',
  url: 'http://example.com/home/?hello=world',
  hello: 'Hello World!',
  half: '50%',
  who: 'fred',
  base: 'http://example.com/home/',
  path: '/foo/bar',
  list: ['red', 'green', 'blue'],
  keys: {
    semi: ';',
    dot: '.',
    comma: ',',
  },
  x: '1024',
  y: '768',
  empty: '',
  undef: undefined,
} as const;

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.2 */
describe('simple string expansion', () => {
  test.each([
    ['{email}', 'john.doe%40example.com'],
    ['{url}', 'http%3A%2F%2Fexample.com%2Fhome%2F%3Fhello%3Dworld'],
    ['{hello}', 'Hello%20World%21'],
    ['{half}', '50%25'],
    ['O{empty}X', 'OX'],
    ['O{undef}X', 'OX'],
    ['{x,y}', '1024,768'],
    ['{x,hello,y}', '1024,Hello%20World%21,768'],
    ['?{x,empty}', '?1024,'],
    ['?{x,undef}', '?1024'],
    ['?{undef,y}', '?768'],
    ['{list}', 'red,green,blue'],
    ['{list*}', 'red,green,blue'],
    ['{keys}', 'semi,%3B,dot,.,comma,%2C'],
    ['{keys*}', 'semi=%3B,dot=.,comma=%2C'],
  ])('%p -> %p', (template, output) => {
    expect(parseURITemplate(template, context)).toBe(output);
  });
});

/**
 * @see https://tools.ietf.org/html/rfc6570#section-3.2.8
 */
describe('form-style query expansion', () => {
  test.each([
    ['{?email}', '?email=john.doe%40example.com'],
    ['{?url}', '?url=http%3A%2F%2Fexample.com%2Fhome%2F%3Fhello%3Dworld'],
    ['{?who}', '?who=fred'],
    ['{?half}', '?half=50%25'],
    ['{?empty}', '?empty='],
    ['{?undef}', ''],
    ['{?x,y}', '?x=1024&y=768'],
    ['{?x,y,empty}', '?x=1024&y=768&empty='],
    ['{?x,y,undef}', '?x=1024&y=768'],
    ['{?list}', '?list=red,green,blue'],
    ['{?list*}', '?list=red&list=green&list=blue'],
    ['{?keys}', '?keys=semi,%3B,dot,.,comma,%2C'],
    ['{?keys*}', '?semi=%3B&dot=.&comma=%2C'],
  ])('%p -> %p', (template, output) => {
    expect(parseURITemplate(template, context)).toBe(output);
  });
});

/**
 * @see https://tools.ietf.org/html/rfc6570#section-3.2.9
 */
describe('form-style query continuation', () => {
  test.each([
    ['{&email}', '&email=john.doe%40example.com'],
    ['{&url}', '&url=http%3A%2F%2Fexample.com%2Fhome%2F%3Fhello%3Dworld'],
    ['{&who}', '&who=fred'],
    ['{&half}', '&half=50%25'],
    ['{&empty}', '&empty='],
    ['{&undef}', ''],
    ['?fixed=yes{&x}', '?fixed=yes&x=1024'],
    ['{&x,y,empty}', '&x=1024&y=768&empty='],
    ['{&x,y,undef}', '&x=1024&y=768'],
    ['{&list}', '&list=red,green,blue'],
    ['{&list*}', '&list=red&list=green&list=blue'],
    ['{&keys}', '&keys=semi,%3B,dot,.,comma,%2C'],
    ['{&keys*}', '&semi=%3B&dot=.&comma=%2C'],
  ])('%p -> %p', (template, output) => {
    expect(parseURITemplate(template, context)).toBe(output);
  });
});
