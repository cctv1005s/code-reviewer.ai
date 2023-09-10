import zhResource from '@/i18n/locales/zh-CN.json';

declare module 'react-i18next' {
  type CustomResources = typeof zhResource;
  interface CustomTypeOptions {
    resources: {
      translation: CustomResources;
    };
  }
}
