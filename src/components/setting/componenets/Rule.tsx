import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCallback, useState } from 'react';
import { promptInstance } from '@/class/Prompt';
import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export const Rule = () => {
  const [rule, setRule] = useState<string | undefined>();
  const { toast } = useToast();
  const { t } = useTranslation();

  useAsyncEffect(async () => {
    const rule = await promptInstance.getCustomRules();
    setRule(rule);
  }, []);

  const onSave = useCallback(async () => {
    await promptInstance.setCustomRules(rule.trim());
    toast({
      title: t('Save successfully!'),
    });
  }, [rule, t]);

  return (
    <div className="w-full h-full flex-col">
      <Textarea
        className="h-6/12"
        onChange={(e) => setRule(e.target.value)}
        value={rule}
        placeholder={t('Enter your custom rule here')}
        style={{ height: 'calc(100% - 4rem)' }}
      />
      <Button onClick={onSave} className="mt-4">
        {t('Save')}
      </Button>
    </div>
  );
};
