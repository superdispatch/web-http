export interface NormalizeURLOptions {
  defaultProtocol?: string;
}

export function normalizeURL(
  input: string,
  { defaultProtocol = 'http' }: NormalizeURLOptions = {},
): string {
  input = input.trim();

  // Relative protocol "//foo.bar"
  if (input.startsWith('//')) {
    input = `${defaultProtocol}:${input}`;
  }
  // Without protocol "foo.bar"
  else if (!/^\w+:\/\//.exec(input)) {
    input = `${defaultProtocol}://${input}`;
  }

  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return input;
  }

  if (url.pathname) {
    url.pathname = url.pathname
      // Remove extra slashes
      .replace(/([^/]:\/\/)|(\/)+/g, '$1$2');
  }

  return url.toString();
}
