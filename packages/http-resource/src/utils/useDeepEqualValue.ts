import { useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Comparator = (a: any, b: any) => boolean;

export function useDeepEqualValue<T>(value: T, isEqual: Comparator): T {
  const ref = useRef(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
