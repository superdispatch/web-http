const EXPRESSION_BLOCK_PATTERN = /{(.*?)}/g;

const EXPRESSION_SEPARATOR = ',';
const EXPRESSION_SEPARATOR_PATTERN = new RegExp(EXPRESSION_SEPARATOR, 'g');

/** @link https://tools.ietf.org/html/rfc6570#section-2.4.2 */
const EXPLODE_MODIFIER = '*';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.8 */
const FORM_STYLE_QUERY_EXPANSION_OPERATOR = '?';

/** @link https://tools.ietf.org/html/rfc6570#section-3.2.9 */
const FORM_STYLE_QUERY_CONTINUATION_OPERATOR = '&';

const FORM_STYLE_SEPARATOR = '&';
const ASSIGNMENT_SYMBOL = '=';

const EXPRESSION_OPERATORS = [
  // Query component beginning with "?" and consisting of name=value pairs separated by "&"
  FORM_STYLE_QUERY_EXPANSION_OPERATOR,

  // Continuation of query-style &name=value pairs within a literal query component
  FORM_STYLE_QUERY_CONTINUATION_OPERATOR,
];

/** @link https://tools.ietf.org/html/rfc6570#section-2.2 */
const EXPRESSION_OPERATOR_PATTERN = new RegExp(
  [
    '[',
    ...EXPRESSION_OPERATORS,
    // Reserved
    '=,!@|',
    ']',
  ].join(''),
  'g',
);

type Param = string | string[] | CompositeParam;
type CompositeParam = Record<string, string>;

function isCompositeParam(param: Param): param is CompositeParam {
  return (
    typeof param === 'object' &&
    Object.prototype.toString.call(param) === '[object Object]'
  );
}

function encode(param: Param): string {
  if (typeof param === 'object') {
    const values: string[] = [];

    if (Array.isArray(param)) {
      for (const value of param) {
        values.push(encode(value));
      }
    } else {
      for (const [key, value] of Object.entries(param)) {
        values.push(encode(key), encode(value));
      }
    }

    return values.join(EXPRESSION_SEPARATOR);
  }

  return encodeURIComponent(param).replace(
    EXPRESSION_OPERATOR_PATTERN,
    (operator) => `%${operator.charCodeAt(0).toString(16)}`,
  );
}

function parseExpressionBlock(
  expressionBlock: string,
): [operator: string, variables: string[]] {
  const firstChar = expressionBlock.charAt(0);
  let operator = '';

  if (EXPRESSION_OPERATORS.includes(firstChar)) {
    operator = firstChar;
    expressionBlock = expressionBlock.slice(1);
  }

  return [operator, expressionBlock.split(EXPRESSION_SEPARATOR_PATTERN)];
}

function parseExpressionVariable(
  variableExpression: string,
): [variable: string, isComposite: boolean] {
  const isComposite = variableExpression.endsWith(EXPLODE_MODIFIER);

  return [
    isComposite ? variableExpression.slice(0, -1) : variableExpression,
    isComposite,
  ];
}

function stringifyAssignment(key: string, value: Param) {
  return encode(key) + ASSIGNMENT_SYMBOL + encode(value);
}

function stringifyCompositeParam(
  separator: string,
  param: CompositeParam,
): string {
  return Object.keys(param)
    .map((key) => encode(key) + ASSIGNMENT_SYMBOL + encode(param[key]))
    .join(separator);
}

function forEachParam(
  variables: string[],
  params: URITemplateParams,
  fn: (variable: string, param: Param) => void,
) {
  for (const variableExpression of variables) {
    const [variable, isComposite] = parseExpressionVariable(variableExpression);
    const param = params[variable] as null | Param;

    if (param != null) {
      if (isComposite && typeof param === 'object') {
        if (Array.isArray(param)) {
          for (const value of param) {
            fn(variable, value);
          }
        } else {
          fn(variable, param);
        }
      } else if (isCompositeParam(param)) {
        fn(variable, Object.entries(param).flat());
      } else {
        fn(variable, param);
      }
    }
  }
}

function stringifyFormStyleExpression(
  operator: string,
  variables: string[],
  params: URITemplateParams,
): string {
  const query: string[] = [];

  forEachParam(variables, params, (variable, param) => {
    if (isCompositeParam(param)) {
      for (const [key, value] of Object.entries(param)) {
        query.push(stringifyAssignment(key, value));
      }
    } else {
      query.push(stringifyAssignment(variable, param));
    }
  });

  if (query.length === 0) {
    return '';
  }

  return operator + query.join(FORM_STYLE_SEPARATOR);
}

function stringifyExpression(
  variables: string[],
  params: URITemplateParams,
): string {
  const values: string[] = [];

  forEachParam(variables, params, (_, param) => {
    if (isCompositeParam(param)) {
      values.push(stringifyCompositeParam(EXPRESSION_SEPARATOR, param));
    } else {
      values.push(encode(param));
    }
  });

  return values.join(EXPRESSION_SEPARATOR);
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
      const [operator, variables] = parseExpressionBlock(expressionBlock);

      switch (operator) {
        case FORM_STYLE_QUERY_EXPANSION_OPERATOR:
        case FORM_STYLE_QUERY_CONTINUATION_OPERATOR:
          return stringifyFormStyleExpression(operator, variables, params);

        default:
          return stringifyExpression(variables, params);
      }
    },
  );
}
