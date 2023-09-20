import { Provider, Tab } from '@/@types/types';

/**
 * Get the provider of the current tab.
 * @param tab
 */
export const getProvider = async (tab: Tab): Promise<Provider> => {
  // Simple verification if it would be a self-hosted GitLab instance.
  // We verify if there is a meta tag present with the content "GitLab".
  const isGitLabResult = (
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        return document.querySelectorAll('meta[content="GitLab"]').length;
      },
    })
  )[0];

  const tokens = tab.url.split('/');

  if (tokens[2] === 'gitee.com' && tokens[5] === 'pulls') {
    return Provider.Gitee;
  }

  if (tokens[2] === 'github.com' && tokens[5] === 'pull') {
    return Provider.GitHub;
  }

  if (
    'result' in isGitLabResult &&
    isGitLabResult.result == 1 &&
    tab.url.includes('/-/merge_requests/')
  ) {
    return Provider.GitLab;
  }

  return Provider.Unknown;
};
