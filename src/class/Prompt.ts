import type { ReviewContext } from './Reviewer';
import parseDiff from 'parse-diff';
import { storageInstance } from './Storage';
import { i18next } from '@/i18n/i18n';

const REGEXP = /GIT\sbinary\spatch(.*)literal\s0/gims;

export enum Language {
  English = 'English',
  Chinese = 'Chinese',
}

const LANGUAGE_STORAGE_KEY = 'LANGUAGE_STORAGE_KEY';
const CUSTOM_RULES_STORAGE_KEY = 'CUSTOM_RULES_STORAGE_KEY';

export class Prompt {
  private customRules: string = '';

  constructor() {
    void this.initialize();
  }

  async initialize() {
    this.customRules = await this.getCustomRules();

    const lang = await this.getLanguage();

    if (lang === Language.Chinese) {
      await i18next.changeLanguage('zh');
    } else {
      await i18next.changeLanguage('en');
    }
  }

  async setLanguage(language: Language) {
    await storageInstance.set(LANGUAGE_STORAGE_KEY, language);
  }

  async getLanguage(): Promise<Language> {
    return (
      (await storageInstance.get(LANGUAGE_STORAGE_KEY)) || Language.English
    );
  }

  async getCustomRules() {
    return storageInstance.get(CUSTOM_RULES_STORAGE_KEY);
  }

  async setCustomRules(rules: string) {
    this.customRules = rules;
    await storageInstance.set('CUSTOM_RULES_STORAGE_KEY', rules);
  }

  /**
   * Get the system prompt
   */
  async getSystemPrompt() {
    return `You are a programming code change reviewer, provide feedback on the code changes given. Do not introduce yourselves.`;
  }

  getCustomRulesPrompt() {
    if (!this.customRules) {
      return '';
    }

    return `
      Here are some additional rules to follow:
       ${this.customRules}
    `;
  }

  /**
   * Get the prompt for the review
   * @param title
   * @param context
   */
  async getPrompt(title: string, context: ReviewContext): Promise<string[]> {
    const promptArray = [];
    const diff = context.diff.replace(REGEXP, '');
    const patchParts = [];
    let warning = '';

    // Separate the patch in different pieces to give ChatGPT more context.
    // Additionally, truncate the part of the patch if it is too big for ChatGPT to handle.
    // https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
    // ChatGPT 3.5 has a maximum token size of 4096 tokens https://platform.openai.com/docs/models/gpt-3-5
    // We will use the guidance of 1 token ~= 4 chars in English, minus 1000 chars to be sure.
    // This means we have 16384, and let's reduce 1000 chars from that.
    const files = parseDiff(diff);

    promptArray.push(`
Your task is to help me do a brief code review on it. Any bug risks and/or improvement suggestions are welcome, answer me with the following format:
\`\`\`
**File** - [filename]
[Your review]
\`\`\`

The change has the following title: ${title}.

A description was given to help you assist in understand why these changes were made.
The description was provided in a markdown format.
${context.description}

You are provided with the code changes (diffs).

Do not provide feedback yet! I will follow-up with the code changes in diff format in a new message.
`);

    // Rebuild our patch as if it were different patches
    files.forEach(function (file) {
      // Ignore lockfiles
      if (file.from.includes('lock.json')) {
        return;
      }

      let patchPartArray = [];

      patchPartArray.push('```diff');
      if ('from' in file && 'to' in file) {
        patchPartArray.push('diff --git a/' + file.from + ' b/' + file.to);
      }
      if ('new' in file && file.new === true && 'newMode' in file) {
        patchPartArray.push('new file mode ' + file.newMode);
      }
      if ('from' in file) {
        patchPartArray.push('--- ' + file.from);
      }
      if ('to' in file) {
        patchPartArray.push('+++ ' + file.to);
      }
      if ('chunks' in file) {
        patchPartArray.push(
          file.chunks.map((c) => c.changes.map((t) => t.content).join('\n')),
        );
      }
      patchPartArray.push('```');
      patchPartArray.push(
        '\nDo not provide feedback yet. I will confirm once all code changes were submitted.',
      );

      let patchPart = patchPartArray.join('\n');
      if (patchPart.length >= 15384) {
        patchPart = patchPart.slice(0, 15384);
        // TODO: throw it to frontend
        warning =
          'Some parts of your patch were truncated as it was larger than 4096 tokens or 15384 characters. The review might not be as complete.';
      }
      patchParts.push(patchPart);
    });

    patchParts.forEach((part) => {
      promptArray.push(part);
    });

    promptArray.push(`
All code changes have been provided.Take a deep breath and think step by step.
Here are some rules to follow:
${this.getCustomRulesPrompt()}

Please provide me with your code review with language ${await this.getLanguage()} based on all the changes, context & title provided 
`);

    return promptArray;
  }
}

export const promptInstance = new Prompt();
