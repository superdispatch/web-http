const EXPRESSION_BLOCK_PATTERN = /{(.*?)}/g;
const EXPRESSION_SEPARATOR_PATTERN = /,/g;

/**
 * @see https://tools.ietf.org/html/rfc6570#section-2.2
 */
const EXPRESSION_OPERATOR_PATTERN = new RegExp(
  '[' +
    // Query component beginning with "?" and consisting of  name=value pairs separated by "&"
    '?' +
    // Continuation of query-style &name=value pairs within a literal query component
    '&' +
    // Reserved
    '=' +
    ',' +
    '!' +
    '@' +
    '|' +
    ']',
  'g',
);

function encode(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(encode).join(',');
  }

  return encodeURIComponent(value as string).replace(
    EXPRESSION_OPERATOR_PATTERN,
    (operator) => `%${operator.charCodeAt(0).toString(16)}`,
  );
}

export function parseExpressionBlock(
  expressionBlock: string,
): [operator: string, variables: string[]] {
  const firstChar = expressionBlock.charAt(0);
  let operator = '';

  if (firstChar.match(EXPRESSION_OPERATOR_PATTERN)) {
    operator = firstChar;
    expressionBlock = expressionBlock.slice(1);
  }

  return [operator, expressionBlock.split(EXPRESSION_SEPARATOR_PATTERN)];
}

// Using `any` as a workaround for `Index signature is missing in type` error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type URITemplateParams = Record<string, any>;

/**
 * Based on https://tools.ietf.org/html/rfc6570
 */
export function parseURITemplate<T extends URITemplateParams>(
  template: string,
  params: T,
): string {
  return template.replace(
    EXPRESSION_BLOCK_PATTERN,
    (_, expressionBlock: string) => {
      const values = new Map<string, string>();
      const [operator, variables] = parseExpressionBlock(expressionBlock);

      for (const variable of variables) {
        let value = encode(params[variable]);

        if (value != null) {
          values.set(variable, value);
        }
      }

      if (operator === '?' || operator === '&') {
        const query = Array.from(values, (entry) => entry.join('=')).join('&');

        if (!query) {
          return '';
        }

        return operator + query;
      }

      return Array.from(values.values()).join(',');
    },
  );
}
