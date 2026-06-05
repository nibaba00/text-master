import type { StorageDriver } from './storageDriver';

/**
 * SQLiteDriver 预留。
 * 后续 Electron/SQLite 接入时启用。
 * 不要强行安装 sqlite 依赖。
 */
export function createSQLiteDriver(): StorageDriver {
  throw new Error('SQLiteDriver 尚未接入。当前仅作为预留接口，不影响本地运行。');
}
