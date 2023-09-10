import { useEffect } from 'react';

/**
 * Async version of useEffect
 * @param callback
 * @param dependencies
 */
export function useAsyncEffect(
  callback: () => Promise<void>,
  dependencies: unknown[],
): void {
  useEffect(() => {
    void callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
