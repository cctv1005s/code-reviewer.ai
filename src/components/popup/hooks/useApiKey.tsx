import { usePromise } from '@/hooks/usePromise';
import { GPTInstance } from '@/class/GPT';

export const useApiKey = (): [null | string, () => Promise<void>] => {
  return usePromise(GPTInstance.getApiKey.bind(GPTInstance));
};
