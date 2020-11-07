type Operator =
  | ''
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

interface OperatorConfig {
  prefix: string;
  separator: string;
  skipEncoding?: boolean;
  withAssignment?: boolean;
  skipEmptyAssignment?: boolean;
}

const configOverrides: Readonly<Partial<
  Record<Operator, Partial<OperatorConfig>>
>> = {
  '+': { prefix: '', skipEncoding: true },
  '#': { skipEncoding: true },
  '.': { separator: '.' },
  '/': { separator: '/' },
  ';': { separator: ';', withAssignment: true, skipEmptyAssignment: true },
  '?': { separator: '&', withAssignment: true },
  '&': { separator: '&', withAssignment: true },
};

function getOperatorConfig(operator: Operator): OperatorConfig {
  return {
    prefix: operator,
    separator: ',',
    ...configOverrides[operator],
  };
}

interface Variable {
  name: string;
  maxLength?: number;
  isComposite?: boolean;
}

function parseVariable(name: string): Variable {
  /** @link https://tools.ietf.org/html/rfc6570#section-2.4.1 */
  const indexOfMaxLengthPrefix = name.indexOf(':');
  if (indexOfMaxLengthPrefix !== -1) {
    return {
      name: name.slice(0, indexOfMaxLengthPrefix),
      maxLength: parseInt(name.slice(indexOfMaxLengthPrefix + 1), 10),
    };
  }

  /** @link https://tools.ietf.org/html/rfc6570#section-2.4.2 */
  if (name.endsWith('*')) {
    return { isComposite: true, name: name.slice(0, -1) };
  }

  return { name };
}

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
  config: OperatorConfig,
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

  return encodeString(String(value), config.skipEncoding);
}

type ListParam = BaseParam[];

function encodeListParam(param: ListParam, config: OperatorConfig): string {
  return param
    .map((value) => encodeBaseParam(value, config))
    .join(config.separator);
}

type CompositeParam = Record<string, BaseParam>;

function compositeToList(param: CompositeParam): ListParam {
  return Object.entries(param).flat();
}

type Param = BaseParam | ListParam | CompositeParam;

function isCompositeParam(param: Param): param is CompositeParam {
  return (
    typeof param === 'object' &&
    Object.prototype.toString.call(param) === '[object Object]'
  );
}

function encodeAssignment(
  key: string,
  value: BaseParam | ListParam,
  config: OperatorConfig,
): null | string {
  if (Array.isArray(value)) {
    value = encodeListParam(value, config);
  } else {
    value = encodeBaseParam(value, config);
  }

  if (value == null) {
    return null;
  }

  let result = encodeString(key, true);

  if (value || !config.skipEmptyAssignment) {
    result += `=${value}`;
  }

  return result;
}

type AssignmentEntry = [key: string, value: BaseParam | ListParam];

function encodeAssignmentEntries(
  entries: AssignmentEntry[],
  config: OperatorConfig,
): null | string {
  const assignments: string[] = [];

  for (const [key, value] of entries) {
    const assignment = encodeAssignment(key, value, config);

    if (assignment != null) {
      assignments.push(assignment);
    }
  }

  if (assignments.length === 0) {
    return null;
  }

  return assignments.join(config.separator);
}

function encodeVariable(
  param: Param,
  { name, maxLength, isComposite }: Variable,
  config: OperatorConfig,
): null | string {
  // Skip undefined values.
  if (param == null) {
    return null;
  }

  if (isCompositeParam(param)) {
    if (isComposite) {
      return encodeAssignmentEntries(
        Object.entries(param).sort(([keyA], [keyB]) =>
          keyA.localeCompare(keyB),
        ),
        config,
      );
    }

    param = compositeToList(param);
  }

  if (Array.isArray(param)) {
    // Skip empty arrays.
    if (param.length === 0) {
      return null;
    }

    if (config.withAssignment) {
      if (isComposite) {
        return encodeAssignmentEntries(
          param.map<AssignmentEntry>((value) => [name, value]),
          config,
        );
      }

      return encodeAssignment(name, param, { ...config, separator: ',' });
    }

    return encodeListParam(
      param,
      isComposite ? config : { ...config, separator: ',' },
    );
  }

  // Truncate string values with max length.
  if (typeof param === 'string' && Number.isInteger(maxLength)) {
    param = param.slice(0, maxLength);
  }

  if (config.withAssignment) {
    return encodeAssignment(name, param, config);
  }

  return encodeBaseParam(param, config);
}

// Using `any` as a workaround for `Index signature is missing in type` error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type URITemplateParams = Record<string, any>;

/**
 * @link https://tools.ietf.org/html/rfc6570
 */
export function parseURITemplate<T extends URITemplateParams>(
  template: string,
  params: T,
): string {
  // Extract all values within `{…}` blocks
  return template.replace(/{(.*?)}/g, (_, input: string): string => {
    let operator: Operator = '';

    if (/^[+#./;?&].+/.test(input)) {
      operator = input.slice(0, 1) as Operator;
      input = input.slice(1);
    }

    const config = getOperatorConfig(operator);

    const values: string[] = [];

    for (const inputName of input.split(/,/g)) {
      const variable = parseVariable(inputName);
      const value = encodeVariable(params[variable.name], variable, config);

      if (value != null) {
        values.push(value);
      }
    }

    if (values.length === 0) {
      return '';
    }

    return config.prefix + values.join(config.separator);
  });
}
