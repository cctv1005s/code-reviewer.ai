import { usePromise } from '@/hooks/usePromise';
import { GPTInstance } from '@/class/GPT';

export const useApiKey = (): null | string => {
  return usePromise(GPTInstance.getApiKey.bind(GPTInstance));
};
