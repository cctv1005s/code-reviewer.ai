import { i18next } from '@/i18n/i18n';

    const lang = await this.getLanguage();

    if (lang === Language.Chinese) {
      await i18next.changeLanguage('zh');
    } else {
      await i18next.changeLanguage('en');
    }
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
    promptArray.push(`
All code changes have been provided.Take a deep breath and think step by step.
Here are some rules to follow:
${this.getCustomRulesPrompt()}

Please provide me with your code review with language ${await this.getLanguage()} based on all the changes, context & title provided 
`);