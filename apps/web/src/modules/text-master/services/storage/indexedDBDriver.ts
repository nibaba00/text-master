import type { StorageDriver } from './storageDriver';

/**
 * IndexedDBDriver 预留。
 * 当 Text Master 需要更大的本地存储容量时启用。
 * 目前以 stub 形式存在，不影响本地运行。
 */
export function createIndexedDBDriver(): StorageDriver {
  const memoryFallback = new Map<string, string>();

  return {
    getItem(key: string): string | null {
      return memoryFallback.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      memoryFallback.set(key, value);
    },
    removeItem(key: string): void {
      memoryFallback.delete(key);
    },
    listKeys(prefix?: string): string[] {
      const keys = Array.from(memoryFallback.keys());
      if (prefix) return keys.filter((k) => k.startsWith(prefix));
      return keys;
    },
    clearNamespace(prefix: string): void {
      const keys = this.listKeys(prefix);
      for (const key of keys) this.removeItem(key);
    },
    exportAll(prefix?: string): Record<string, string> {
      const result: Record<string, string> = {};
      for (const key of this.listKeys(prefix)) {
        const v = this.getItem(key);
        if (v !== null) result[key] = v;
      }
      return result;
    },
    importAll(data: Record<string, string>): void {
      for (const [k, v] of Object.entries(data)) this.setItem(k, v);
    },
  };
}
