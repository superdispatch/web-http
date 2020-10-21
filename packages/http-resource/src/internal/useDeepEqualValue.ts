import { dequal } from 'dequal/lite';
import { useEffect, useRef } from 'react';

export function useDeepEqualValue<T>(value: T): T {
  const ref = useRef(value);
  const isEqual = dequal(ref.current, value);

  useEffect(() => {
    if (!isEqual) {
      ref.current = value;
    }
  });

  return isEqual ? ref.current : value;
}
