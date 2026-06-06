import type { StorageDriver } from './storageDriver';

/**
 * ElectronFileDriver 预留。
 * 后续用于保存项目数据到用户本地文件目录。
 */
export function createElectronFileDriver(): StorageDriver {
  throw new Error('ElectronFileDriver 尚未接入。当前仅作为预留接口，不影响本地运行。');
}
