import type { StorageDriver } from './storageDriver';

export function createLocalStorageDriver(): StorageDriver {
  const memoryStorage = new Map<string, string>();

  function getLocalStorage(): Storage | null {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  }

  return {
    getItem(key: string): string | null {
      const storage = getLocalStorage();
      if (storage) return storage.getItem(key);
      return memoryStorage.get(key) ?? null;
    },

    setItem(key: string, value: string): void {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(key, value);
        return;
      }
      memoryStorage.set(key, value);
    },

    removeItem(key: string): void {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(key);
        return;
      }
      memoryStorage.delete(key);
    },

    listKeys(prefix?: string): string[] {
      const storage = getLocalStorage();
      const keys: string[] = [];
      if (storage) {
        for (let i = 0; i < storage.length; i++) {
          keys.push(storage.key(i)!);
        }
      } else {
        keys.push(...memoryStorage.keys());
      }
      if (prefix) {
        return keys.filter((k) => k.startsWith(prefix));
      }
      return keys;
    },

    clearNamespace(prefix: string): void {
      const keys = this.listKeys(prefix);
      for (const key of keys) {
        this.removeItem(key);
      }
    },

    exportAll(prefix?: string): Record<string, string> {
      const result: Record<string, string> = {};
      const keys = this.listKeys(prefix);
      for (const key of keys) {
        const value = this.getItem(key);
        if (value !== null) {
          result[key] = value;
        }
      }
      return result;
    },

    importAll(data: Record<string, string>): void {
      for (const [key, value] of Object.entries(data)) {
        this.setItem(key, value);
      }
    },
  };
}
