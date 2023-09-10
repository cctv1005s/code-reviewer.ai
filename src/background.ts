import { EventKey } from '@/constants/constants';
import { reviewerInstance } from '@/class/Reviewer';
import { storageInstance } from '@/class/Storage';
import { GPTInstance, ReviewProcessStatus, ReviewProgress } from '@/class/GPT';
// @ts-ignore
import { Buffer } from 'buffer';
import { Tab } from '@/@types/types';

globalThis.Buffer = Buffer;

/**
 * Send message to popup
 * @param uniqKey
 * @param msg
 */
const sendToPopup = async (uniqKey: string, msg: ReviewProgress) => {
  try {
    await chrome.runtime.sendMessage({
      type: EventKey.ReviewMsg,
      msg,
      uniqKey,
    });
  } catch (e) {}

  try {
    const cache = JSON.parse(await storageInstance.get(uniqKey));
    cache.msg = msg;
    await storageInstance.set(uniqKey, JSON.stringify(cache));
  } catch (e) {}
};

type Request = Parameters<
  Parameters<typeof chrome.runtime.onMessage.addListener>[0]
>[0];

/**
 * Handle message from popup
 * @param request
 */
const onMessage = async (request: Request) => {
  const tab = request.tab as Tab;
  const uniqKey = tab.uniqKey;

  switch (request.type) {
    case EventKey.StartReview:
      try {
        await storageInstance.set(uniqKey, null);
        const result = await reviewerInstance.review(request.tab);
        await storageInstance.set(uniqKey, JSON.stringify(result));

        if (result.url) {
          GPTInstance.on(result.url, (msg) => sendToPopup(uniqKey, msg));
        }

        return result;
      } catch (e) {
        await sendToPopup(uniqKey, {
          status: ReviewProcessStatus.Failed,
          message: e.message,
        });
        return null;
      }

    case EventKey.QueryReview:
      const cache = await storageInstance.get(uniqKey);
      if (!cache) {
        return null;
      }

      try {
        return JSON.parse(cache);
      } catch (e) {
        return null;
      }
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  onMessage(request).then(sendResponse);
  return true;
});
