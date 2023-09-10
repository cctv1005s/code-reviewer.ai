import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import { PropsWithChildren, useCallback, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export enum Menu {
  Provider = 'Provider',
  Rule = 'Rule',
}

export const menus = Object.values(Menu);

/**
 * Slider
 */
export const Slider = (
  props: PropsWithChildren<{
    onSelect?: (key: Menu) => void;
    onGoBack: () => void;
  }>,
) => {
  const [active, setActive] = useState<Menu>(Menu.Provider);
  const [t] = useTranslation();

  /**
   * Select menu
   */
  const onSelect = useCallback((key: Menu) => {
    setActive(key);
    props.onSelect?.(key);
  }, []);

  return (
    <div className="flex flex-col p-4 h-full grow">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex flex-row items-center">
          <ArrowLeft
            onClick={props.onGoBack}
            className="mr-2 hover:bg-muted cursor-pointer rounded-full"
          />
          {t('Settings')}
        </h2>
      </div>
      <Separator className="my-3" />
      <div className="flex flex-row w-full grow">
        <div className="flex flex-col lg:flex-col lg:space-x-0 lg:space-y-1 mr-8">
          {menus.map((menu) => {
            const isActive = active === menu;
            return (
              <Button
                key={menu}
                className={clsx(
                  'justify-start pl-4 pr-14 py-0 h-8 w-full mb-2',
                  {
                    'bg-muted hover:bg-muted': isActive,
                    'hover:bg-transparent hover:underline': !isActive,
                  },
                )}
                size="sm"
                variant="ghost"
                onClick={() => onSelect(menu as Menu)}
              >
                {t(menu)}
              </Button>
            );
          })}
        </div>
        <div className="grow">{props.children}</div>
      </div>
    </div>
  );
};
