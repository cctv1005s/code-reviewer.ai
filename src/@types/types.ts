export interface Tab {
  id?: number;
  url?: string;
  title?: string;
  uniqKey?: string;
}

export enum Provider {
  GitHub = 'github',
  GitLab = 'gitlab',
  Gitee = 'gitee',
  // TODO: support more Bitbucket & Codeup
  Bitbucket = 'bitbucket',
  Codeup = 'codeup',
  Unknown = 'unknown',
}
