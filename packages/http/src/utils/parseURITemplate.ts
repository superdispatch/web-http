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

function encodeString(
  value: string,
  skipEncoding: boolean | undefined,
): string {
  if (skipEncoding) {
    return (
      encodeURI(value)
        // Revert double encoding.
        .replace(/%25([0-9A-F]{2})/gi, '%$1')
    );
  }

  return (
    encodeURIComponent(value)
      // Encode exclamation sign.
      .replace(/!/g, '%21')
  );
}

type BaseParam = null | undefined | number | string | Date;

function encodeBaseParam(
  value: BaseParam,
  skipEncoding: boolean | undefined,
): null | string {
  if (value == null) {
    return null;
  }

  if (typeof value == 'number' && !Number.isFinite(value)) {
    return null;
  }

  if (value instanceof Date) {
    return value.toJSON();
  }

  return encodeString(String(value), skipEncoding);
}

type ListParam = BaseParam[];

interface EncodeListParamOptions {
  separator?: string;
  skipEncoding?: boolean;
}

function encodeListParam(
  param: ListParam,
  { separator, skipEncoding }: EncodeListParamOptions,
): string {
  return param
    .map((value) => encodeBaseParam(value, skipEncoding))
    .join(separator);
}

type CompositeParam = Record<string, BaseParam>;

function flattenCompositeParam(param: CompositeParam): ListParam {
  return Object.entries(param).flat();
}

type Param = BaseParam | ListParam | CompositeParam;

function isCompositeParam(param: Param): param is CompositeParam {
  return (
    typeof param === 'object' &&
    Object.prototype.toString.call(param) === '[object Object]'
  );
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

interface EncodeAssignmentOptions extends EncodeListParamOptions {
  skipEmptyValues?: boolean;
}

function encodeAssignment(
  key: string,
  value: BaseParam | ListParam,
  {
    separator,
    skipEncoding,

    skipEmptyValues,
  }: EncodeAssignmentOptions,
): null | string {
  if (Array.isArray(value)) {
    value = encodeListParam(value, { separator, skipEncoding });
  } else {
    value = encodeBaseParam(value, skipEncoding);
  }

  if (value == null) {
    return null;
  }

  let result = encodeString(key, true);

  if (value || !skipEmptyValues) {
    result += `=${value}`;
  }

  return result;
}

function encodeCompositeParam(
  param: CompositeParam,
  { separator, skipEncoding, skipEmptyValues }: EncodeAssignmentOptions,
): string {
  return Object.entries(param)
    .map(([key, value]) =>
      encodeAssignment(key, value, {
        separator,
        skipEncoding,
        skipEmptyValues,
      }),
    )
    .join(separator);
}

interface EncodeVariableOptions extends EncodeAssignmentOptions {
  withAssignment?: boolean;
}

function encodeVariable(
  param: Param,
  { key: variableKey, maxLength, isComposite }: Variable,
  {
    separator,
    skipEncoding,
    withAssignment,
    skipEmptyValues,
  }: EncodeVariableOptions,
): null | string {
  // Skip undefined values.
  if (param == null) {
    return null;
  }

  if (isCompositeParam(param)) {
    if (isComposite) {
      if (withAssignment) {
        const assignments: string[] = [];

        for (const [key, value] of Object.entries(param)) {
          const assignment = encodeAssignment(key, value, {
            separator,
            skipEncoding,
            skipEmptyValues,
          });

          if (assignment != null) {
            assignments.push(assignment);
          }
        }

        if (assignments.length === 0) {
          return null;
        }

        return assignments.join(separator);
      }

      return encodeCompositeParam(param, {
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
        const assignments: string[] = [];

        for (const value of param) {
          const assignment = encodeAssignment(variableKey, value, {
            skipEncoding,
            skipEmptyValues,
          });

          if (assignment != null) {
            assignments.push(assignment);
          }
        }

        if (assignments.length === 0) {
          return null;
        }

        return assignments.join(separator);
      }

      return encodeAssignment(variableKey, param, {
        skipEncoding,
        skipEmptyValues,
        separator: listSeparator,
      });
    }

    return encodeListParam(param, {
      skipEncoding,
      separator: isComposite ? separator : undefined,
    });
  }

  // Truncate string values with max length.
  if (typeof param === 'string' && Number.isInteger(maxLength)) {
    param = param.slice(0, maxLength);
  }

  if (withAssignment) {
    return encodeAssignment(variableKey, param, {
      skipEncoding,
      skipEmptyValues,
    });
  }

  return encodeBaseParam(param, skipEncoding);
}

// Using `any` as a workaround for `Index signature is missing in type` error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type URITemplateParams = Record<string, any>;

interface EncodeExpressionBlockOptions extends EncodeVariableOptions {
  prefix?: string;
}

function encodeExpressionBlock(
  params: URITemplateParams,
  variables: Variable[],
  {
    prefix = '',
    separator,
    skipEncoding,
    withAssignment,
    skipEmptyValues,
  }: EncodeExpressionBlockOptions,
) {
  const values: string[] = [];

  for (const variable of variables) {
    const value = encodeVariable(params[variable.key], variable, {
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
      const options: EncodeExpressionBlockOptions = {};

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

      return encodeExpressionBlock(params, variables, options);
    },
  );
}
