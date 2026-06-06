import {
  createVersion,
  listVersions,
} from '../services/versionService';

export function createVersionStore() {
  return {
    listVersions,
    createVersion,
  };
}
