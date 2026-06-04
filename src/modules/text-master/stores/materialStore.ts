import {
  getMaterial,
  listMaterials,
  saveMaterial,
} from '../services/materialService';

export function createMaterialStore() {
  return {
    listMaterials,
    getMaterial,
    saveMaterial,
  };
}
