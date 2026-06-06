import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function readJsonFile(filePath, fallback) {
  const resolvedPath = resolve(filePath);

  if (!existsSync(resolvedPath)) {
    return fallback;
  }

  try {
    return JSON.parse(readFileSync(resolvedPath, 'utf8'));
  } catch (error) {
    console.warn(
      `[api] Failed to read JSON file at ${resolvedPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return fallback;
  }
}

export function writeJsonFile(filePath, data) {
  const resolvedPath = resolve(filePath);
  const directory = dirname(resolvedPath);
  const tempPath = `${resolvedPath}.tmp`;

  mkdirSync(directory, { recursive: true });
  writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  renameSync(tempPath, resolvedPath);
}
