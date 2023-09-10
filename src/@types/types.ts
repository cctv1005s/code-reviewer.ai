export interface Tab {
  id?: number;
  url?: string;
  title?: string;
  uniqKey?: string;
}

export enum Provider {
  GitHub = 'github',
  GitLab = 'gitlab',
  Unknown = 'unknown',
}
