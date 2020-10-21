import { DependencyList, useMemo } from 'react';

import { useDeepEqualValue } from './useDeepEqualValue';

export function useDeepEqualMemo<T>(factory: () => T, deps: DependencyList): T {
  const pureDeps = useDeepEqualValue(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, pureDeps);

  return useDeepEqualValue(value);
}
