import { resolve } from 'node:path';

export function getProjectsPath() {
  return resolve(process.env.TEXT_MASTER_PROJECTS_PATH ?? 'data/projects.json');
}

export function getGenerationsPath() {
  return resolve(process.env.TEXT_MASTER_GENERATIONS_PATH ?? 'data/generations.json');
}

export function getExportsPath() {
  return resolve(process.env.TEXT_MASTER_EXPORTS_PATH ?? 'data/exports.json');
}
