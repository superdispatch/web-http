const ASSIGNMENT_SYMBOL = '=';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.3 */
const RESERVED_EXPANSION_OPERATOR = '+';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.4 */
const FRAGMENT_EXPANSION_OPERATOR = '#';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.5 */
const DOT_PREFIX_EXPANSION_OPERATOR = '.';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.6 */
const PATH_SEGMENT_EXPANSION_OPERATOR = '/';

/** https://tools.ietf.org/html/rfc6570#section-3.2.7 */
const PATH_STYLE_PARAMETER_EXPANSION_OPERATOR = ';';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.8 */
const FORM_STYLE_QUERY_EXPANSION_OPERATOR = '?';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.9 */
const FORM_STYLE_QUERY_CONTINUATION_OPERATOR = '&';

const FORM_STYLE_SEPARATOR = '&';

const EXPRESSION_OPERATORS = [
  RESERVED_EXPANSION_OPERATOR,
  FRAGMENT_EXPANSION_OPERATOR,
  DOT_PREFIX_EXPANSION_OPERATOR,
  PATH_SEGMENT_EXPANSION_OPERATOR,
  PATH_STYLE_PARAMETER_EXPANSION_OPERATOR,
  FORM_STYLE_QUERY_EXPANSION_OPERATOR,
  FORM_STYLE_QUERY_CONTINUATION_OPERATOR,
] as const;

type Operator = typeof EXPRESSION_OPERATORS[number];

const EXPRESSION_BLOCK_PATTERN = /{(.*?)}/g;
const EXPRESSION_BLOCK_ITEMS_PATTERN = new RegExp(
  [
    // Begins with optional operator.
    `^([${EXPRESSION_OPERATORS.join('')}])?`,
    // Everything else
    '(.+)',
  ].join(''),
);

const EXPRESSION_SEPARATOR = ',';
const EXPRESSION_SEPARATOR_PATTERN = new RegExp(EXPRESSION_SEPARATOR, 'g');

const VARIABLE_PATTERN = new RegExp(
  // Everything at the beginning
  '(.+)' +
    '(' +
    /** @link https://tools.ietf.org/html/rfc6570#section-2.4.2 */
    '(\\*)$' +
    '|' +
    /** @link https://tools.ietf.org/html/rfc6570#section-2.4.1 */
    '(:(\\d+))' +
    ')$',
);

type ListParam = string[];
type CompositeParam = Record<string, string>;
type Param = string | ListParam | CompositeParam;

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
  const matches = EXPRESSION_BLOCK_ITEMS_PATTERN.exec(expressionBlock);
  let operator = '';

  if (matches) {
    operator = matches[1];
    expressionBlock = matches[2];
  }

  const variables = expressionBlock.split(EXPRESSION_SEPARATOR_PATTERN).map(
    (key): Variable => {
      let isComposite = false;
      let maxLength = Infinity;

      const variableMatches = VARIABLE_PATTERN.exec(key);

      if (variableMatches) {
        key = variableMatches[1];

        if (variableMatches[3]) {
          isComposite = true;
        } else if (variableMatches[5]) {
          maxLength = parseInt(variableMatches[5], 10);
        }
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
  value: string,
  { skipEncoding }: StringifyPrimitiveOptions = {},
) {
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
  { separator, ...options }: StringifyListOptions,
): string {
  return param
    .map((value) => stringifyPrimitive(value, options))
    .join(separator);
}

interface StringifyAssignmentOptions extends StringifyListOptions {
  skipEmptyValues?: boolean;
}

function stringifyAssignment(
  key: string,
  value: string | ListParam,
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
    result += ASSIGNMENT_SYMBOL + value;
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
  if (Number.isInteger(maxLength)) {
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
  }: StringifyExpressionBlockOptions = {},
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
 * Based on https://tools.ietf.org/html/rfc6570
 */
export function parseURITemplate<T extends URITemplateParams>(
  template: string,
  params: T,
): string {
  return template.replace(
    EXPRESSION_BLOCK_PATTERN,
    (_, expressionBlock: string) => {
      const { operator, variables } = parseExpressionBlock(expressionBlock);
      const options: StringifyExpressionBlockOptions = {};

      switch (operator) {
        case RESERVED_EXPANSION_OPERATOR: {
          options.prefix = '';
          options.skipEncoding = true;
          break;
        }

        case FRAGMENT_EXPANSION_OPERATOR: {
          options.prefix = operator;
          options.skipEncoding = true;

          break;
        }
        case DOT_PREFIX_EXPANSION_OPERATOR:
        case PATH_SEGMENT_EXPANSION_OPERATOR: {
          options.prefix = operator;
          options.separator = operator;

          break;
        }

        case PATH_STYLE_PARAMETER_EXPANSION_OPERATOR: {
          options.prefix = operator;
          options.separator = operator;
          options.withAssignment = true;
          options.skipEmptyValues = true;

          break;
        }

        case FORM_STYLE_QUERY_EXPANSION_OPERATOR:
        case FORM_STYLE_QUERY_CONTINUATION_OPERATOR: {
          options.prefix = operator;
          options.separator = FORM_STYLE_SEPARATOR;
          options.withAssignment = true;

          break;
        }
      }

      return stringifyExpressionBlock(params, variables, options);
    },
  );
}
