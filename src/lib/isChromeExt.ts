export const isChromeExt = (): boolean => {
  // @ts-ignore
  return !!globalThis.chrome.storage;
};
