import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { useCallback, useState } from 'react';

/**
 * Async version of useEffect
 * @param fn
 * @param params
 */
export const usePromise = <T extends any[], R extends unknown>(
  fn: (...params: ((undefined & undefined[]) | T)[]) => Promise<R>,
  params?: T,
): [R | undefined, () => Promise<void>] => {
  const [value, setValue] = useState<R | undefined>(undefined);
  useAsyncEffect(async () => {
    setValue(await fn(...(params || [])));
  }, []);

  const run = useCallback(async () => {
    setValue(await fn(...(params || [])));
  }, []);

  return [
    value,
    run
  ];
};
