import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Language, promptInstance } from '@/class/Prompt';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsyncEffect } from '@/hooks/useAsyncEffect';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  /**
   * Initialize i18n
   */
  const i18nInitialize = useCallback(async (language: Language) => {
    if (language === Language.Chinese) {
      await i18n.changeLanguage('zh');
    } else {
      await i18n.changeLanguage('en');
    }
  }, []);

  const setLanguage = useCallback(
    async (language: Language) => {
      await promptInstance.setLanguage(language);

      await i18nInitialize(language);
    },
    [i18nInitialize],
  );

  useAsyncEffect(async () => {
    const language = await promptInstance.getLanguage();

    await i18nInitialize(language);
  }, [i18nInitialize]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2 rounded-full">
          <Languages className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(Language).map((language) => {
          return (
            <DropdownMenuItem onClick={() => setLanguage(language as Language)}>
              {language}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
