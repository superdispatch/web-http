export interface NormalizeURLOptions {
  defaultProtocol?: string;
}

export function normalizeURL(
  input: unknown,
  { defaultProtocol = 'http' }: NormalizeURLOptions = {},
): string | undefined {
  if (typeof input != 'string') {
    return undefined;
  }

  let inputString = input.trim();

  if (inputString.length === 0) {
    return undefined;
  }

  // Relative protocol "//foo.bar"
  if (inputString.startsWith('//')) {
    inputString = `${defaultProtocol}:${inputString}`;
  }
  // Without protocol "foo.bar"
  else if (!/^\w+:\/\//.exec(inputString)) {
    inputString = `${defaultProtocol}://${inputString}`;
  }

  let url: URL;

  try {
    url = new URL(inputString);
  } catch {
    return inputString;
  }

  if (url.pathname) {
    url.pathname = url.pathname
      // Remove extra slashes
      .replace(/([^/]:\/\/)|(\/)+/g, '$1$2');
  }

  return url.toString();
}
