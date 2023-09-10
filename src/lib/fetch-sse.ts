import { createParser } from 'eventsource-parser';
import { streamAsyncIterable } from '@/lib/streamAsyncIterable';

export async function fetchSSE(
  url: string,
  options: Parameters<typeof fetch>[1] & {
    onMessage: (data: string) => void;
    onError?: (error: Error) => void;
  },
) {
  const { onMessage, onError, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let reason: string;

    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }

    const msg = `ChatGPT error ${res.status}: ${reason}`;
    throw Error(msg);
  }

  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data);
    }
  });

  // handle special response errors
  const feed = (chunk: string) => {
    let response = null;

    try {
      response = JSON.parse(chunk);
    } catch {
      // ignore
    }

    if (response?.detail?.type === 'invalid_request_error') {
      const msg = `Dify error ${response?.detail.message}: ${response?.detail.code} (${response?.detail.type})`;
      const error = Error(msg);

      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }

      // don't feed to the event parser
      return;
    }

    parser.feed(chunk);
  };

  if (!res.body.getReader) {
    const body: NodeJS.ReadableStream = res.body as any;

    if (!body.on || !body.read) {
      throw new Error('unsupported "fetch" implementation');
    }

    body.on('readable', () => {
      let chunk: string | Buffer;
      while (null !== (chunk = body.read())) {
        feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      // @ts-ignore
      const str = new TextDecoder().decode(chunk);
      feed(str);
    }
  }
}
