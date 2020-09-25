type Operator =
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.3 */
  | '+'
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.4 */
  | '#'
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.5 */
  | '.'
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.6 */
  | '/'
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.7 */
  | ';'
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.8 */
  | '?'
  /** @link https://tools.ietf.org/html/rfc6570#section-3.2.9 */
  | '&';

type PrimitiveParam = number | string;
type ListParam = PrimitiveParam[];
type CompositeParam = Record<string, PrimitiveParam>;
type Param = PrimitiveParam | ListParam | CompositeParam;

function isCompositeParam(param: Param): param is CompositeParam {
  return (
    typeof param === 'object' &&
    Object.prototype.toString.call(param) === '[object Object]'
  );
}

function flattenCompositeParam(param: CompositeParam): ListParam {
  return Object.entries(param).flat();
}

interface Variable {
  key: string;
  maxLength: number;
  isComposite: boolean;
}

interface ExpressionBlock {
  operator?: Operator;
  variables: Variable[];
}

function parseExpressionBlock(expressionBlock: string): ExpressionBlock {
  const operatorMatch = /^([+#./;?&])(.+)/.exec(expressionBlock);
  let operator = '';

  if (operatorMatch) {
    operator = operatorMatch[1];
    expressionBlock = operatorMatch[2];
  }

  const variables = expressionBlock.split(/,/g).map(
    (key): Variable => {
      let maxLength = NaN;
      let isComposite = false;

      const variableMatches =
        /**
         * @link https://tools.ietf.org/html/rfc6570#section-2.4.1
         * @link https://tools.ietf.org/html/rfc6570#section-2.4.2
         */
        /(.+)((\*)|(:(\d+)))$/.exec(key);

      if (variableMatches) {
        key = variableMatches[1];

        isComposite = !!variableMatches[3];
        maxLength = parseInt(variableMatches[5], 10);
      }

      return { key, maxLength, isComposite };
    },
  );

  return { variables, operator: (operator || undefined) as Operator };
}

// Using `any` as a workaround for `Index signature is missing in type` error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type URITemplateParams = Record<string, any>;

interface StringifyPrimitiveOptions {
  skipEncoding?: boolean;
}

function stringifyPrimitive(
  value: PrimitiveParam,
  { skipEncoding }: StringifyPrimitiveOptions,
) {
  value = String(value);

  if (skipEncoding) {
    value = encodeURI(value)
      // Rollback double encoding.
      .replace(/%25([0-9A-F]{2})/gi, '%$1');
  } else {
    value = encodeURIComponent(value)
      // Encode exclamation sign.
      .replace(/!/g, '%21');
  }

  return value;
}

interface StringifyListOptions extends StringifyPrimitiveOptions {
  separator?: string;
}

function stringifyList(
  param: ListParam,
  { separator, skipEncoding }: StringifyListOptions,
): string {
  return param
    .map((value) => stringifyPrimitive(value, { skipEncoding }))
    .join(separator);
}

interface StringifyAssignmentOptions extends StringifyListOptions {
  skipEmptyValues?: boolean;
}

function stringifyAssignment(
  key: string,
  value: PrimitiveParam | ListParam,
  {
    separator,
    skipEncoding,

    skipEmptyValues,
  }: StringifyAssignmentOptions,
): string {
  let result = stringifyPrimitive(key, { skipEncoding: true });

  if (Array.isArray(value)) {
    value = stringifyList(value, { separator, skipEncoding });
  } else {
    value = stringifyPrimitive(value, { skipEncoding });
  }

  if (value || !skipEmptyValues) {
    result += `=${value}`;
  }

  return result;
}

function stringifyCompositeParam(
  param: CompositeParam,
  { separator, skipEncoding, skipEmptyValues }: StringifyAssignmentOptions,
): string {
  return Object.entries(param)
    .map(([key, value]) =>
      stringifyAssignment(key, value, {
        separator,
        skipEncoding,
        skipEmptyValues,
      }),
    )
    .join(separator);
}

interface StringifyVariableOptions extends StringifyAssignmentOptions {
  withAssignment?: boolean;
}

function stringifyVariable(
  param: null | Param,
  { key, maxLength, isComposite }: Variable,
  {
    separator,
    skipEncoding,
    withAssignment,
    skipEmptyValues,
  }: StringifyVariableOptions,
): null | string {
  // Skip undefined values.
  if (param == null) {
    return null;
  }

  if (isCompositeParam(param)) {
    if (isComposite) {
      if (withAssignment) {
        const entries = Object.entries(param).map(([prop, value]) =>
          stringifyAssignment(prop, value, {
            separator,
            skipEncoding,
            skipEmptyValues,
          }),
        );

        if (entries.length === 0) {
          return null;
        }

        return entries.join(separator);
      }

      return stringifyCompositeParam(param, {
        separator,
        skipEncoding,
        skipEmptyValues,
      });
    }

    param = flattenCompositeParam(param);
  }

  if (Array.isArray(param)) {
    // Skip empty arrays.
    if (param.length === 0) {
      return null;
    }

    const listSeparator = isComposite ? separator : undefined;

    if (withAssignment) {
      if (isComposite) {
        return param
          .map((value) =>
            stringifyAssignment(key, value, { skipEncoding, skipEmptyValues }),
          )
          .join(separator);
      }

      return stringifyAssignment(key, param, {
        skipEncoding,
        skipEmptyValues,
        separator: listSeparator,
      });
    }

    return stringifyList(param, {
      skipEncoding,
      separator: isComposite ? separator : undefined,
    });
  }

  // Truncate string values with max length.
  if (typeof param === 'string' && Number.isInteger(maxLength)) {
    param = param.slice(0, maxLength);
  }

  if (withAssignment) {
    return stringifyAssignment(key, param, { skipEncoding, skipEmptyValues });
  }

  return stringifyPrimitive(param, { skipEncoding });
}

interface StringifyExpressionBlockOptions extends StringifyVariableOptions {
  prefix?: string;
}

function stringifyExpressionBlock(
  params: URITemplateParams,
  variables: Variable[],
  {
    prefix = '',
    separator,
    skipEncoding,
    withAssignment,
    skipEmptyValues,
  }: StringifyExpressionBlockOptions,
) {
  const values: string[] = [];

  for (const variable of variables) {
    const value = stringifyVariable(params[variable.key], variable, {
      separator,
      skipEncoding,
      withAssignment,
      skipEmptyValues,
    });

    if (value != null) {
      values.push(value);
    }
  }

  if (values.length === 0) {
    return '';
  }

  return prefix + values.join(separator);
}

/**
 * @link https://tools.ietf.org/html/rfc6570
 */
export function parseURITemplate<T extends URITemplateParams>(
  template: string,
  params: T,
): string {
  return template.replace(
    // Extract all values within `{…}` blocks
    /{(.*?)}/g,
    (_, expressionBlock: string) => {
      const { operator, variables } = parseExpressionBlock(expressionBlock);
      const options: StringifyExpressionBlockOptions = {};

      switch (operator) {
        case '+': {
          options.prefix = '';
          options.skipEncoding = true;
          break;
        }

        case '#': {
          options.prefix = operator;
          options.skipEncoding = true;

          break;
        }

        case '.':
        case '/': {
          options.prefix = operator;
          options.separator = operator;

          break;
        }

        case ';': {
          options.prefix = operator;
          options.separator = operator;
          options.withAssignment = true;
          options.skipEmptyValues = true;

          break;
        }

        case '?':
        case '&': {
          options.separator = '&';
          options.prefix = operator;
          options.withAssignment = true;

          break;
        }
      }

      return stringifyExpressionBlock(params, variables, options);
    },
  );
}
