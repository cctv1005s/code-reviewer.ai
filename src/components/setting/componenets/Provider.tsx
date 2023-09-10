import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { APIType, GPTInstance } from '@/class/GPT';
import { useCallback, useState } from 'react';
import ChatGPTLogo from '@/assets/images/chatgpt_logo.png';
import DIFYLogo from '@/assets/images/dify_logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { clsx } from 'clsx';
import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { useTranslation } from 'react-i18next';

const PROVIDERS = [
  {
    key: APIType.ChatGPT,
    name: 'ChatGPT',
    icon: ChatGPTLogo,
  },
  {
    key: APIType.DIFY,
    name: 'Dify',
    icon: DIFYLogo,
  },
];

const PROVIDER_OFFICIAL_SITE = {
  [APIType.ChatGPT]: 'https://platform.openai.com/account/api-keys',
  [APIType.DIFY]: 'https://dify.ai/',
};

export const Provider = () => {
  const [apiType, setApiType] = useState<APIType>(APIType.ChatGPT);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState<string | undefined>();
  const [endpoint, setEndpoint] = useState<string | undefined>();

  /**
   * Save settings
   */
  const onSave = useCallback(async () => {
    if (!apiKey) {
      toast({
        title: t('API key is required!'),
      });
      return;
    }

    await GPTInstance.setApiKey(apiKey);
    await GPTInstance.setProxyUrl(endpoint);

    toast({
      title: t('Save successfully!'),
    });
  }, [apiKey, t, endpoint]);

  /**
   * Select provider
   */
  const onSelect = useCallback(async (apiType: APIType) => {
    await GPTInstance.setApiType(apiType);
    setApiType(apiType);
    const apiKey = await GPTInstance.getApiKey();
    setApiKey(apiKey || '');
  }, []);

  useAsyncEffect(async () => {
    const apiType = await GPTInstance.getApiType();
    await GPTInstance.setApiType(apiType);

    const apiKey = await GPTInstance.getApiKey();
    const endpoint = await GPTInstance.getProxyUrl();

    setApiKey(apiKey);
    setEndpoint(endpoint);
    setApiType(apiType);
  }, [apiType]);

  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="grid gap-2 grid-cols-2">
        {PROVIDERS.map((provider) => {
          return (
            <Card
              className={clsx('hover:bg-muted', {
                'bg-muted ring ring-ring ring-1': apiType === provider.key,
              })}
              key={provider.key}
              onClick={() => onSelect(provider.key)}
            >
              <CardContent className="flex flex-row items-center py-2 px-2 cursor-pointer">
                <img alt="logo" src={provider.icon} className="h-6" />
                <div className="text-base ml-2">{provider.name}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground pt-3">
        {t('Currently using')}{' '}
        <a className="underline" href={PROVIDER_OFFICIAL_SITE[apiType]}>
          {apiType}
        </a>{' '}
        {t('for code review')}.
      </p>
      <Separator className="my-3" />
      <div className="grid gap-6 w-full">
        <div className="grid gap-2">
          <Label>{t('Api key')}</Label>
          <Input
            onChange={(e) => setApiKey(e.target.value)}
            className="h-8"
            type="password"
            value={apiKey}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t('Endpoint(optional)')}</Label>
          <Input
            onChange={(e) => setEndpoint(e.target.value)}
            value={endpoint}
            className="h-8"
          />
        </div>
        <Button onClick={onSave}>{t('Save')}</Button>
      </div>
    </div>
  );
};
