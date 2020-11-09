import { normalizeURL } from './normalizeURL';

test.each([
  [' ', undefined],
  [null, undefined],
  [undefined, undefined],

  ['foo.com', 'http://foo.com/'],
  ['Foo.com', 'http://foo.com/'],
  ['foo.com ', 'http://foo.com/'],

  ['//foo.com', 'http://foo.com/'],
  ['http://foo.com', 'http://foo.com/'],
  ['HTTP://foo.com', 'http://foo.com/'],

  ['http://foo.com:80', 'http://foo.com/'],
  ['https://foo.com:443', 'https://foo.com/'],
  ['ftp://foo.com:21', 'ftp://foo.com/'],

  ['www.com', 'http://www.com/'],
  ['www.foo.com', 'http://www.foo.com/'],
  ['http://www.foo.com', 'http://www.foo.com/'],
  ['http://www.www.foo.com', 'http://www.www.foo.com/'],

  ['http://foo.com/foo/', 'http://foo.com/foo/'],
  ['foo.com/?foo=bar baz', 'http://foo.com/?foo=bar%20baz'],

  ['http://foo.com//://bar.com//a///b', 'http://foo.com/:/bar.com/a/b'],
  ['http://foo.com//http://bar.com//a//b', 'http://foo.com/http://bar.com/a/b'],
  ['//foo.com//a///b//', 'http://foo.com/a/b/'],
  ['http://foo.com////a/b', 'http://foo.com/a/b'],
  ['http://foo.com////a////b', 'http://foo.com/a/b'],
  ['http://foo.com:5000///a', 'http://foo.com:5000/a'],
  ['http://foo.com///a', 'http://foo.com/a'],
  ['http://foo.com:5000//a', 'http://foo.com:5000/a'],
  ['http://foo.com//a', 'http://foo.com/a'],
  ['http://foo.com/bar://baz.com', 'http://foo.com/bar://baz.com'],
  ['http://foo.com/bar://baz.com//a', 'http://foo.com/bar://baz.com/a'],
  ['http://foo.com//bar/baz://qux.com', 'http://foo.com/bar/baz://qux.com'],
  ['http://foo.com/a2-.+://bar.com', 'http://foo.com/a2-.+://bar.com'],
  ['http://foo.com/a2-.+_://bar.com', 'http://foo.com/a2-.+_://bar.com'],
  ['http://foo.com/2abc://bar.com', 'http://foo.com/2abc://bar.com'],

  ['http://foo.com/?', 'http://foo.com/?'],
  ['ƒøø.com', 'http://xn--pdaa47b.com/'],
  ['https://ebаy.com', 'https://xn--eby-7cd.com/'],

  ['http://example.com/?b=bar&a=foo', 'http://example.com/?b=bar&a=foo'],
  [
    'http://example.com/?foo=bar*|<>:"',
    'http://example.com/?foo=bar*|%3C%3E:%22',
  ],
  ['http://foo.com:5000', 'http://foo.com:5000/'],
  ['http://foo.com/a#b', 'http://foo.com/a#b'],

  ['http://foo.com/a/b/../c', 'http://foo.com/a/c'],
  ['http://foo.com/a/b/./c', 'http://foo.com/a/b/c'],

  ['foo://www.bar.com', 'foo://www.bar.com'],
  ['foo://www.bar.com/', 'foo://www.bar.com/'],
  ['foo://www.bar.com/foo/bar', 'foo://www.bar.com/foo/bar'],

  ['http://foo:bar@www.baz.com', 'http://foo:bar@www.baz.com/'],
  ['https://foo:bar@www.baz.com', 'https://foo:bar@www.baz.com/'],
  ['http://foo:bar@www.baz.com/@qux', 'http://foo:bar@www.baz.com/@qux'],
  ['foo:bar@www.baz.com', 'http://foo:bar@www.baz.com/'],
  [
    'http://ƒoo:bår@www.baΩ.com',
    'http://%C6%92oo:b%C3%A5r@www.xn--ba-fcc.com/',
  ],
  ['foo://bar:baz@qux.com', 'foo://bar:baz@qux.com'],

  ['/', 'http:///'],
  ['a', 'http://a/'],
  ['a//b///c', 'http://a/b/c'],
  ['http://', 'http://'],
])('normalizeURL(%p) -> %p', (input, expected) => {
  expect(normalizeURL(input)).toBe(expected);
});

test('defaultProtocol', () => {
  expect(normalizeURL('example.com', { defaultProtocol: 'https' })).toBe(
    'https://example.com/',
  );

  expect(normalizeURL('//example.com', { defaultProtocol: 'https' })).toBe(
    'https://example.com/',
  );
});
