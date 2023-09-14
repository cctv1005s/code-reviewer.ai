import { promptInstance } from './Prompt';
import { GPTInstance } from './GPT';
import { Tab, Provider } from '@/@types/types';
import { getProvider } from '@/lib/getProvider';
import { i18next } from '@/i18n/i18n';

export interface ReviewProcess {
  url?: string;
  title?: string;
}

export interface ReviewContext {
  diff: string;
  description: string;
}

class Reviewer {
  /**
   * Get the context of the current review.
   * @param url
   * @private
   */
  private async requestPatchDiff(url: string) {
    const cache = await chrome.storage.session.get();

    if (cache[url]) {
      console.log('Using the cache for ' + url);
      return cache[url];
    }

    const result = await fetch(url).then((r) => r.text());

    await chrome.storage.session.set({
      [url]: result,
    });

    return result;
  }

  /**
   * Get the context of the current review.
   * @private
   */
  private async getReviewContext(tab: Tab): Promise<ReviewContext> {
    const provider = await getProvider(tab);
    const tokens = tab.url.split('/');

    if (provider === Provider.GitHub) {
      // The path towards the patch file of this change
      const diffPathUrl = `https://patch-diff.githubusercontent.com/raw/${tokens[3]}/${tokens[4]}/pull/${tokens[6]}.diff`;

      const diff = await this.requestPatchDiff(diffPathUrl);

      // The description of the author of the change
      // Fetch it by running a querySelector script specific to GitHub on the active tab
      const contextExternalResult = (
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: () => {
            return document.querySelector('.markdown-body').textContent;
          },
        })
      )[0];

      if ('result' in contextExternalResult) {
        return {
          description: contextExternalResult.result,
          diff: diff,
        };
      }

      return null;
    }

    if (provider === Provider.GitLab) {
      // The path towards the patch file of this change
      const diffPathUrl = tab.url + '.diff';

      const diff = await this.requestPatchDiff(diffPathUrl);
      // The description of the author of the change
      // Fetch it by running a querySelector script specific to GitLab on the active tab
      const contextExternalResult = (
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: () => {
            return document
              .querySelector('.description textarea')
              .getAttribute('data-value');
          },
        })
      )[0];

      if ('result' in contextExternalResult) {
        return {
          description: contextExternalResult.result,
          diff: diff,
        };
      }

      return null;
    }
  }

  /**
   * Send the context to GPT.
   * @param url
   * @param title
   * @param context
   * @private
   */
  private async sendToGPT(url: string, title: string, context: ReviewContext) {
    const messages = await promptInstance.getPrompt(title, context);

    await GPTInstance.send(url, messages);
  }

  async review(tab: Tab): Promise<ReviewProcess> {
    const result: ReviewProcess = {};

    if (!tab) {
      throw Error(i18next.t('Get page info failed'));
    }

    result.url = tab.url;
    result.title = tab.title;

    const provider = await getProvider(tab);

    if (provider === Provider.Unknown) {
      throw Error(
        i18next.t(
          'Unknown page, only GitHub(pr) and GitLab(mr) are supported.',
        ),
      );
    }

    (async () => {
      // let diffPath;
      const context = await this.getReviewContext(tab);

      // send to GPT
      await this.sendToGPT(tab.url, tab.title, context);
    })();

    return result;
  }
}

export const reviewerInstance = new Reviewer();
