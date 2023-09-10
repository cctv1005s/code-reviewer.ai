import { Menu, Slider } from '@/components/slider/Slider';
import { useState } from 'react';
import { Provider } from '@/components/setting/componenets/Provider';
import { Rule } from '@/components/setting/componenets/Rule';

interface SettingProps {
  onGoBack: () => void;
}

export const Setting = (props: SettingProps) => {
  const [activeMenu, setActiveMenu] = useState<Menu>(Menu.Provider);

  return (
    <Slider onSelect={setActiveMenu} onGoBack={props.onGoBack}>
      {activeMenu === Menu.Provider && <Provider />}
      {activeMenu === Menu.Rule && <Rule />}
    </Slider>
  );
};
