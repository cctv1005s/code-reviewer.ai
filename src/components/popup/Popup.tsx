import { Button } from '@/components/ui/button';
import IconImg from '/public/icons/icon_128.png';
import { ThemeProvider } from '../theme/theme-provider';
import { ModeToggle } from '../theme/mode-toggle';
import { useApiKey } from '@/components/popup/hooks/useApiKey';
import { useCallback, useEffect, useState } from 'react';
import { Setting } from '@/components/setting/Setting';
import { useReview } from '@/components/popup/hooks/useReview';
import { ReviewProcessStatus } from '@/class/GPT';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { LanguageToggle } from '@/components/popup/components/LanguageToggle';
import { useTranslation } from 'react-i18next';

enum Pages {
  Popup = 'popup',
  Setting = 'setting',
}

export const Popup = () => {
  const [apiKey, getApiKey] = useApiKey();
  const [activeTab, setActiveTab] = useState<Pages>(Pages.Popup);
  const { title, url, msg, run, isSending } = useReview();
  const { t } = useTranslation();

  const gotoSetting = useCallback(() => {
    setActiveTab(Pages.Setting);
  }, []);


  useEffect(() => {
    getApiKey();
  }, [activeTab]);

  if (activeTab === Pages.Setting) {
    return <Setting onGoBack={() => setActiveTab(Pages.Popup)} />;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex flex-column p-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center mr-28">
            <img
              alt="logo"
              src={IconImg}
              style={{ height: '2.5rem' }}
              className="pt-2"
            />
            <div className="text-base ml-2">CodeReviewer.ai</div>
          </div>
          <div className="flex justify-between items-center">
            <Button variant="link" onClick={gotoSetting}>
              {t('Setting')}
            </Button>
            <Button disabled={isSending} size="sm" onClick={() => run()}>
              {t('Rerun')}
            </Button>
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <Separator className="my-3 mt-2" />
        {title && (
          <div className="mb-3">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {title}
            </h4>
            <p className="leading-7">{url}</p>
          </div>
        )}
        {!apiKey && (
          <Button
            className="text-base h-full w-full flex justify-center items-center"
            variant="link"
            onClick={gotoSetting}
          >
            {t('No api key, click here to set it up.')}
          </Button>
        )}

        {apiKey && msg.status === ReviewProcessStatus.Failed && (
          <div className="h-32 w-full text-center text-base">
            <div className="font-bold">☹{t('An error occurred')}:</div>
            <p />
            {msg.message}
          </div>
        )}

        {apiKey && msg.status === ReviewProcessStatus.Running && (
          <div className="flex flex-row items-center justify-center h-32">
            <Loader2 className="animate-spin" />
            <div
              className="ml-2"
              dangerouslySetInnerHTML={{
                __html: msg.message || t('processing...'),
              }}
            ></div>
          </div>
        )}

        {apiKey && msg.status === ReviewProcessStatus.Completed && (
          <>
            <div dangerouslySetInnerHTML={{ __html: msg.message }}></div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
};
