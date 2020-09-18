const EXPRESSION_PATTERN = /{(.*?)}/g;
const EXPRESSION_SEPARATOR_PATTERN = /,/g;

/**
 * @see https://tools.ietf.org/html/rfc6570#section-2.2
 */
const OPERATORS_PATTERN = new RegExp(
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
    OPERATORS_PATTERN,
    (operator) => `%${operator.charCodeAt(0).toString(16)}`,
  );
}

// Using `any` as a workaround for `Index signature is missing in type` error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type URITemplateParams = Record<string, any>;

/**
 * Based on https://tools.ietf.org/html/rfc6570
 */
export class URITemplate<T extends URITemplateParams> {
  protected template: string;

  constructor(template: string) {
    this.template = template;
  }

  expand(params: T): string {
    return this.template.replace(
      EXPRESSION_PATTERN,
      (_, expression: string) => {
        const values = new Map<string, string>();
        let operator: string = expression.charAt(0);

        if (operator.match(OPERATORS_PATTERN)) {
          expression = expression.slice(1);
        } else {
          operator = '';
        }

        for (const variable of expression.split(EXPRESSION_SEPARATOR_PATTERN)) {
          let value = encode(params[variable]);

          if (value != null) {
            values.set(variable, value);
          }
        }

        if (operator === '?' || operator === '&') {
          const query = Array.from(values, (entry) => entry.join('=')).join(
            '&',
          );

          if (!query) {
            return '';
          }

          return operator + query;
        }

        return Array.from(values.values()).join(',');
      },
    );
  }
}
