import { DependencyList, useMemo } from 'react';

import { Comparator, useDeepEqualValue } from './useDeepEqualValue';

export function useDeepEqualMemo<T>(
  factory: () => T,
  deps: DependencyList,
  isEqual: Comparator,
): T {
  const pureDeps = useDeepEqualValue(deps, isEqual);
  const value = useMemo(factory, pureDeps);

  return useDeepEqualValue(value, isEqual);
}
