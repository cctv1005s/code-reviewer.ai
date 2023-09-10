import EventEmitter from 'eventemitter3';
import { ChatGPTAPI, ChatGPTAPIOptions, SendMessageOptions } from 'chatgpt';
import { marked } from 'marked';
import { CommonRenderer } from '@/class/Renderer';

import { promptInstance } from './Prompt';
import { storageInstance } from './Storage';
import { fetchSSE } from '@/lib/fetchSSE';
import {
  DifyRequestBody,
  DifyResponseMessage,
  DifyResponseMode,
} from '@/@types/dify';

export const CHATGPT_KEY = 'chatgpt_key';
export const DIFY_KEY = 'dify_key';
const API_TYPE_KEY = 'api_type_key';
const DIFY_ENDPOINT = 'https://api.dify.ai/v1/chat-messages';

export enum APIType {
  ChatGPT = 'chatgpt',
  DIFY = 'dify',
}

export enum ReviewProcessStatus {
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Timeout = 'timeout',
}

export interface ReviewProgress {
  status: ReviewProcessStatus;
  message: string;
}

const globalRender = new CommonRenderer();

export class GPT extends EventEmitter {
  private apiType = APIType.ChatGPT;
  private runningInstance: Record<string, string> = {};

  /**
   * Set API type
   * @param apiType
   */
  async setApiType(apiType: APIType) {
    this.apiType = apiType;
    await storageInstance.set(API_TYPE_KEY, apiType);
  }

  /**
   * Get api type
   */
  async getApiType(): Promise<APIType> {
    const apiType = await storageInstance.get(API_TYPE_KEY);

    if (!apiType) {
      return this.apiType;
    }

    this.apiType = apiType as APIType;
    return apiType as APIType;
  }

  /**
   * Get storage key of proxy url
   * @private
   */
  private getProxyUrlStorageKey(): string {
    if (this.apiType === APIType.ChatGPT) {
      return CHATGPT_KEY + '_proxy';
    }

    return DIFY_KEY + '_proxy';
  }

  /**
   * Get storage key of api key
   * @private
   */
  private getApiKeyStorageKey(): string {
    if (this.apiType === APIType.ChatGPT) {
      return CHATGPT_KEY;
    }

    return DIFY_KEY;
  }

  /**
   * Get proxy url
   */
  async getProxyUrl(): Promise<string> {
    await this.getApiType();
    return storageInstance.get<string>(this.getProxyUrlStorageKey());
  }

  /**
   * Set proxy url
   * @param proxyUrl
   */
  async setProxyUrl(proxyUrl: string) {
    await this.getApiType();
    return storageInstance.set(this.getProxyUrlStorageKey(), proxyUrl);
  }

  /**
   * Get API type
   */
  async getApiKey(): Promise<string> {
    await this.getApiType();
    return storageInstance.get<string>(this.getApiKeyStorageKey());
  }

  /**
   * Set API key
   * @param apiKey
   */
  async setApiKey(apiKey: string) {
    await this.getApiType();
    return storageInstance.set(this.getApiKeyStorageKey(), apiKey);
  }

  /**
   * Send message to GPT
   * @param uniqKey
   * @param messages
   * @private
   */
  private async sendByChatGPT(uniqKey: string, messages: string[]) {
    const instanceId = this.runningInstance[uniqKey];
    const options: ChatGPTAPIOptions = {
      apiKey: await this.getApiKey(),
      systemMessage: await promptInstance.getSystemPrompt(),
    };

    if (await this.getProxyUrl()) {
      options.apiBaseUrl = await this.getProxyUrl();
    }

    const api = new ChatGPTAPI(options);

    let iterations = messages.length;
    let lastResponse;

    for (const message of messages) {
      // Stop it if we have a new instance
      if (this.runningInstance[uniqKey] !== instanceId) {
        return;
      }

      iterations--;

      try {
        // Last prompt
        let options: SendMessageOptions = {};

        // If we have no iterations left, it means it's the last of our prompt messages.
        if (iterations == 0) {
          options = {
            onProgress: async (partialResponse) => {
              if (this.runningInstance[uniqKey] !== instanceId) {
                return;
              }

              this.emit(uniqKey, {
                status: ReviewProcessStatus.Completed,
                message: await marked.parse(partialResponse.text, {
                  renderer: globalRender,
                  async: true,
                }),
              });
            },
          };
        }
        // In progress
        else {
          options = {
            onProgress: () =>
              this.emit(uniqKey, {
                status: ReviewProcessStatus.Running,
                message: `processing, ${iterations} left...`,
              }),
          };
        }

        if (lastResponse) {
          options.parentMessageId = lastResponse.id;
        }

        lastResponse = await api.sendMessage(message, options);
      } catch (e) {
        console.error(e);

        this.emit(uniqKey, {
          status: ReviewProcessStatus.Failed,
          message: e.message,
        });
        return;
      }
    }

    delete this.runningInstance[uniqKey];
  }

  /**
   * Send messages to DIFY
   * @param uniqKey
   * @param messages
   * @private
   */
  private async sendByDify(uniqKey: string, messages: string[]) {
    let index = 0;
    let answer = '';
    let conversationId = '';
    const endpoint = await this.getProxyUrl();

    for (const message of messages) {
      const isLast = index === messages.length - 1;
      const body: DifyRequestBody = {
        query: message,
        response_mode: DifyResponseMode.Streaming,
        inputs: {},
        user: uniqKey,
        conversation_id: undefined,
      };

      if (conversationId) {
        body.conversation_id = conversationId;
      }

      await fetchSSE(endpoint ?? DIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getApiKey()}`,
          'Content-Type': 'application/json',
        },
        onMessage: async (message) => {
          const response = JSON.parse(message) as DifyResponseMessage;
          conversationId = response.conversation_id;

          if (!isLast) {
            this.emit(uniqKey, {
              status: ReviewProcessStatus.Running,
              message: `processing ${messages.length - index} left...`,
            });

            return;
          }

          try {
            answer += response.answer;

            this.emit(uniqKey, {
              status: ReviewProcessStatus.Completed,
              message: await marked.parse(answer, {
                renderer: globalRender,
                async: true,
              }),
            });
          } catch (e) {}
        },
        onError: (e) => {
          if (isLast) {
            this.emit(uniqKey, {
              status: ReviewProcessStatus.Failed,
              message: e.message,
            });
          }
        },
        body: JSON.stringify(body),
      });

      index++;
    }
    return;
  }

  /**
   * Send messages to GPT
   * @param uniqKey
   * @param messages
   */
  async send(uniqKey: string, messages: string[]) {
    await this.getApiType();
    // set uniq id
    this.runningInstance[uniqKey] = new Date().toString();

    if (this.apiType === APIType.ChatGPT) {
      return this.sendByChatGPT(uniqKey, messages);
    }

    if (this.apiType === APIType.DIFY) {
      return this.sendByDify(uniqKey, messages);
    }

    throw Error('Unknown API type.');
  }
}

export const GPTInstance = new GPT();
