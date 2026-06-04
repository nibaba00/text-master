const memoryStorage = new Map<string, string>();

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
    const rawValue = getStoredValue(key);

    if (rawValue === null) {
      writeStoredValue(key, JSON.stringify(initialValue));
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
    writeStoredValue(key, JSON.stringify(value));
  } catch (error) {
    throw new TextMasterServiceError(service, 'writeCollection', error);
  }
}

export function createTextMasterId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);

  return `${prefix}-${Date.now()}-${randomPart}`;
}

export function countTextWords(content: string): number {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return 0;
  }

  const cjkMatches = trimmedContent.match(/[\u4e00-\u9fff]/g) ?? [];
  const latinSource = trimmedContent.replace(/[\u4e00-\u9fff]/g, ' ');
  const latinMatches = latinSource.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];

  return cjkMatches.length + latinMatches.length;
}

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStoredValue(key: string): string | null {
  const storage = getLocalStorage();

  if (storage) {
    return storage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

function writeStoredValue(key: string, value: string): void {
  const storage = getLocalStorage();

  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
