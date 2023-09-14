import { useCallback, useEffect, useState } from 'react';
import { ReviewProcessStatus, ReviewProgress } from '@/class/GPT';
import { EventKey } from '@/constants/constants';
import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { getCurrentTab } from '@/lib/getCurrentTab';

interface ReviewResult {
  msg: ReviewProgress;
  title: string;
  url: string;
  run: () => void;
  isSending: boolean;
}

interface ReviewCache {
  url: string;
  title: string;
  msg?: ReviewProgress;
}

/**
 * Query review cache from background
 */
const queryReviewCache = async () => {
  const tab = await getCurrentTab();
  return new Promise<ReviewCache | undefined>(async (resolve) => {
    chrome.runtime.sendMessage({ type: EventKey.QueryReview, tab }, (res) => {
      resolve(res as ReviewCache);
    });
  });
};

/**
 * Send review request to background
 */
const sendReviewRequest = async () => {
  const tab = await getCurrentTab();

  return new Promise<Omit<ReviewCache, 'msg'> | undefined>((resolve) => {
    chrome.runtime.sendMessage({ type: EventKey.StartReview, tab }, (res) => {
      resolve(res);
    });
  });
};

/**
 * Hook to run the review process
 */
export const useReview = (): ReviewResult => {
  const [msg, setMsg] = useState<ReviewProgress>({
    status: ReviewProcessStatus.Running,
    message: '',
  });

  const [title, setTitle] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  useAsyncEffect(async () => {
    try {
      const cache = await queryReviewCache();

      if (cache) {
        setUrl(cache.url);
        setTitle(cache.title);

        if (cache.msg) {
          setMsg(cache.msg);
          return;
        }
      }

      setIsSending(true);
      const result = await sendReviewRequest();

      setTitle(result?.title);
      setUrl(result?.url);
    } catch (e) {
      console.error(e);
      setMsg({
        status: ReviewProcessStatus.Failed,
        message: e.message,
      });
    } finally {
      setIsSending(false);
    }
  }, []);

  useEffect(() => {
    let tab;

    /**
     * Listen to message from background
     * @param request
     */
    const onMessage = async (request) => {
      if (!tab) {
        tab = await getCurrentTab();
      }

      if (request.uniqKey !== tab.uniqKey) {
        return;
      }

      if (request.type === EventKey.ReviewMsg) {
        setMsg(request.msg);
      }
    };

    chrome.runtime.onMessage.addListener(onMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  /**
   * Run the review process
   */
  const run = useCallback(async () => {
    if (isSending) {
      return;
    }
    setMsg({
      status: ReviewProcessStatus.Running,
      message: '',
    });
    await sendReviewRequest();
  }, []);

  return {
    msg,
    title,
    url,
    run,
    isSending,
  };
};
