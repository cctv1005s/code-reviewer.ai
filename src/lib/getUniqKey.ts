import { Provider, Tab } from '@/@types/types';
import { getProvider } from '@/lib/getProvider';

/**
 * Get the uniq key of the current tab.
 * @param tab
 */
export const getUniqKey = async (tab: Tab): Promise<string> => {
  const provider = await getProvider(tab);
  let regexp;

  if (provider === Provider.GitHub) {
    // https://github.com/a/b/pull/32/xx
    regexp = /pull\/\d+(\/.*)?$/;
  } else if (provider === Provider.GitLab) {
    // https://gitlab.com/ivangergo3/tencent-scf-puppeteer/-/merge_requests/1/xx
    // -> https://gitlab.com/ivangergo3/tencent-scf-puppeteer/-/merge_requests/1
    regexp = /merge_requests\/\d+(\/.*)?$/;
  } else {
    return tab.url;
  }

  const match = tab.url.match(regexp);

  if (!match) {
    return tab.url;
  }

  if (!match[1]) {
    return tab.url;
  }

  const replaceRegExp = new RegExp(match[1] + '$');

  return tab.url.replace(replaceRegExp, '');
};
