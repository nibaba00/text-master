export interface StorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  listKeys(prefix?: string): string[];
  clearNamespace(prefix: string): void;
  exportAll(prefix?: string): Record<string, string>;
  importAll(data: Record<string, string>): void;
}

let activeDriver: StorageDriver | null = null;

export function setStorageDriver(driver: StorageDriver): void {
  activeDriver = driver;
}

export function getStorageDriver(): StorageDriver {
  if (!activeDriver) {
    throw new Error('StorageDriver 未初始化。');
  }
  return activeDriver;
}
