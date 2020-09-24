/** @link https://tools.ietf.org/html/rfc6570#section-2.4.2 */
const EXPLODE_MODIFIER = '*';

/** @link https://tools.ietf.org/html/rfc6570#section-2.4.1 */
const MAX_LENGTH_PREFIX = ':';

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

type Param = string | string[] | CompositeParam;
type CompositeParam = Record<string, string>;

function isRecord(param: Param): param is CompositeParam {
  return (
    typeof param === 'object' &&
    Object.prototype.toString.call(param) === '[object Object]'
  );
}

function stringifyPrimitive(value: string, isEncoded: boolean): string {
  if (isEncoded) {
    value = encodeURI(value).replace(/%25([0-9A-F]{2})/gi, '%$1');
  } else {
    value = encodeURIComponent(value).replace(/!/g, '%21');
  }

  return value;
}

function stringifyParam(
  param: Param,
  separator = EXPRESSION_SEPARATOR,
  isEncoded: boolean,
): string {
  if (typeof param !== 'object') {
    return stringifyPrimitive(param, isEncoded);
  }

  const values: string[] = [];

  if (Array.isArray(param)) {
    for (const value of param) {
      values.push(stringifyPrimitive(value, isEncoded));
    }
  } else {
    for (const [key, value] of Object.entries(param)) {
      values.push(key, stringifyPrimitive(value, isEncoded));
    }
  }

  return values.join(separator);
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
  let operator: undefined | Operator;

  if (matches) {
    if (matches[1]) {
      operator = matches[1] as Operator;
    }

    expressionBlock = matches[2];
  }

  const variables = expressionBlock.split(EXPRESSION_SEPARATOR_PATTERN).map(
    (key): Variable => {
      let isComposite = false;
      let maxLength = Infinity;

      if (key.endsWith(EXPLODE_MODIFIER)) {
        isComposite = true;
        key = key.slice(0, -1);
      }

      if (key.includes(MAX_LENGTH_PREFIX)) {
        const chunks = key.split(MAX_LENGTH_PREFIX);

        key = chunks[0];
        maxLength = parseInt(chunks[1], 10);
      }

      return { key, maxLength, isComposite };
    },
  );

  return { operator, variables };
}

function stringifyAssignment(
  key: string,
  value: Param,
  isEncoded: boolean,
  skipEmptyValue: boolean,
) {
  key = stringifyPrimitive(key, true);
  value = stringifyParam(value, undefined, isEncoded);

  if (skipEmptyValue && !value) {
    return key;
  }

  return key + ASSIGNMENT_SYMBOL + value;
}

function stringifyCompositeParam(
  param: CompositeParam,
  separator: string,
  isEncoded: boolean,
  skipEmptyValue: boolean,
): string {
  return Object.entries(param)
    .map(([key, value]) =>
      stringifyAssignment(key, value, isEncoded, skipEmptyValue),
    )
    .join(separator);
}

function forEachParam(
  variables: Variable[],
  params: URITemplateParams,
  fn: (variable: string, param: Param) => void,
) {
  for (const { key, maxLength, isComposite } of variables) {
    let param = params[key] as null | Param;

    if (param == null) {
      continue;
    }

    if (isRecord(param) && !isComposite) {
      param = Object.entries(param).flat();
    }

    if (Array.isArray(param) && param.length === 0) {
      continue;
    }

    if (typeof param === 'string' && Number.isInteger(maxLength)) {
      param = param.slice(0, maxLength);
    }

    if (isComposite && typeof param === 'object') {
      if (Array.isArray(param)) {
        for (const value of param) {
          fn(key, value);
        }
      } else {
        fn(key, param);
      }
    } else {
      fn(key, param);
    }
  }
}

function stringifyFormStyleExpression(
  prefix: string,
  separator: string,
  variables: Variable[],
  params: URITemplateParams,
  skipEmptyValue: boolean,
): string {
  const query: string[] = [];

  forEachParam(variables, params, (variable, param) => {
    if (isRecord(param)) {
      for (const [key, value] of Object.entries(param)) {
        query.push(stringifyAssignment(key, value, false, skipEmptyValue));
      }
    } else {
      query.push(stringifyAssignment(variable, param, false, skipEmptyValue));
    }
  });

  if (query.length === 0) {
    return '';
  }

  return prefix + query.join(separator);
}

function stringifyExpression(
  prefix: string,
  separator: string,
  variables: Variable[],
  params: URITemplateParams,
  isEncoded: boolean,
): string {
  const values: string[] = [];

  forEachParam(variables, params, (_, param) => {
    if (isRecord(param)) {
      values.push(stringifyCompositeParam(param, separator, isEncoded, false));
    } else {
      values.push(stringifyParam(param, undefined, isEncoded));
    }
  });

  if (values.length === 0) {
    return '';
  }

  return prefix + values.join(separator);
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
      const { operator, variables } = parseExpressionBlock(expressionBlock);

      switch (operator) {
        case RESERVED_EXPANSION_OPERATOR:
          return stringifyExpression(
            '',
            EXPRESSION_SEPARATOR,
            variables,
            params,
            true,
          );

        case FRAGMENT_EXPANSION_OPERATOR:
          return stringifyExpression(
            operator,
            EXPRESSION_SEPARATOR,
            variables,
            params,
            true,
          );

        case DOT_PREFIX_EXPANSION_OPERATOR:
        case PATH_SEGMENT_EXPANSION_OPERATOR:
          return stringifyExpression(
            operator,
            operator,
            variables,
            params,
            false,
          );

        case PATH_STYLE_PARAMETER_EXPANSION_OPERATOR:
          return stringifyFormStyleExpression(
            operator,
            operator,
            variables,
            params,
            true,
          );

        case FORM_STYLE_QUERY_EXPANSION_OPERATOR:
        case FORM_STYLE_QUERY_CONTINUATION_OPERATOR:
          return stringifyFormStyleExpression(
            operator,
            FORM_STYLE_SEPARATOR,
            variables,
            params,
            false,
          );

        default:
          return stringifyExpression(
            '',
            EXPRESSION_SEPARATOR,
            variables,
            params,
            false,
          );
      }
    },
  );
}
