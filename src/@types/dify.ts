export interface DifyResponseMessage {
  event: string;
  task_id: string;
  id: string;
  answer: string;
  created_at: number;
  conversation_id: string;
}

export enum DifyResponseMode {
  Streaming = 'streaming',
  Blokcing = 'blocking',
}

export interface DifyRequestBody {
  query: string;
  response_mode: DifyResponseMode;
  inputs: Record<string, any>;
  user: string;
  conversation_id?: string;
}
