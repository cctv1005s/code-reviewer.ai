import { getUniqKey } from '@/lib/getUniqKey';
import { Tab } from '@/@types/types';

/**
 * Get current tab
 */
export const getCurrentTab = async (): Promise<Tab> => {
  const tab = (
    await chrome.tabs.query({ active: true, currentWindow: true })
  )[0];

  return {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    uniqKey: await getUniqKey(tab),
  } as Tab;
};
