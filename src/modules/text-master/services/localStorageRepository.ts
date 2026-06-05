import { getStorageDriver } from './storage/storageDriver';

const TEXT_MASTER_NAMESPACE = 'text-master:';

export class TextMasterServiceError extends Error {
  readonly service: string;
  readonly operation: string;
  readonly originalError: unknown;

  constructor(service: string, operation: string, originalError: unknown) {
    super(`${service}.${operation} failed`);
    this.name = 'TextMasterServiceError';
    this.service = service;
    this.operation = operation;
    this.originalError = originalError;
  }
}

export async function runServiceAction<T>(
  service: string,
  operation: string,
  action: () => Promise<T> | T,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof TextMasterServiceError) {
      throw error;
    }
    throw new TextMasterServiceError(service, operation, error);
  }
}

export function readCollection<T>(
  key: string,
  initialValue: T[],
  service: string,
): T[] {
  try {
    const rawValue = getStorageDriver().getItem(key);

    if (rawValue === null) {
      getStorageDriver().setItem(key, JSON.stringify(initialValue));
      return cloneValue(initialValue);
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      throw new Error(`Invalid collection stored at ${key}`);
    }

    return cloneValue(parsedValue as T[]);
  } catch (error) {
    throw new TextMasterServiceError(service, 'readCollection', error);
  }
}

export function writeCollection<T>(
  key: string,
  value: T[],
  service: string,
): void {
  try {
    getStorageDriver().setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new TextMasterServiceError(service, 'writeCollection', error);
  }
}

export function replaceCollection<T>(
  key: string,
  value: T[],
  service: string,
): void {
  writeCollection(key, cloneValue(value), service);
}

export function removeStoredCollection(key: string): void {
  getStorageDriver().removeItem(key);
}

export function createTextMasterId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

export function countTextWords(content: string): number {
  const trimmedContent = content.trim();

  if (!trimmedContent) return 0;

  const cjkMatches = trimmedContent.match(/[\u4e00-\u9fff]/g) ?? [];
  const latinSource = trimmedContent.replace(/[\u4e00-\u9fff]/g, ' ');
  const latinMatches =
    latinSource.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];

  return cjkMatches.length + latinMatches.length;
}

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// --- 数据备份 ---

export function exportAllLocalData(): Record<string, string> {
  return getStorageDriver().exportAll(TEXT_MASTER_NAMESPACE);
}

export function importAllLocalData(data: Record<string, string>): void {
  // 只导入 text-master: 前缀的数据
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith(TEXT_MASTER_NAMESPACE)) {
      getStorageDriver().setItem(key, value);
    }
  }
}

export function resetLocalData(): void {
  getStorageDriver().clearNamespace(TEXT_MASTER_NAMESPACE);
}
