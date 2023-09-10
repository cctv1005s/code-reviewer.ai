import { isChromeExt } from '@/lib/isChromeExt';

class Storage {
  position = 'local';

  private isChromeExt() {
    return isChromeExt();
  }

  async set(key, value) {
    if (!this.isChromeExt()) {
      return (localStorage[key] = value);
    }

    return new Promise((resolve) => {
      chrome.storage['local'].set({ [key]: value }, () => {
        resolve(null);
      });
    });
  }

  async get<T = string>(key, defaultValue = undefined): Promise<T> {
    if (!this.isChromeExt()) {
      return localStorage[key] ?? defaultValue;
    }

    return new Promise<T>((resolve) => {
      chrome.storage[this.position].get(key, (result) => {
        if (result[key] || typeof result[key] === 'boolean') {
          resolve(result[key] as T);
        }

        resolve(defaultValue as T);
      });
    });
  }

  async remove(key) {
    if (!this.isChromeExt()) {
      delete localStorage[key];

      return;
    }

    return new Promise((resolve) => {
      chrome.storage[this.position].remove(key, () => {
        console.log(key, 'remove done!');
        resolve(true);
      });
    });
  }
}

export const storageInstance = new Storage();
