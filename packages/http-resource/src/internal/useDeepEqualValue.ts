import { dequal } from 'dequal/lite';
import { useRef } from 'react';

export function useDeepEqualValue<T>(value: T): T {
  const ref = useRef(value);

  if (!dequal(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
