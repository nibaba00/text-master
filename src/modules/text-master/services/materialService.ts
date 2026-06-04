import { mockMaterials } from '../mock/mockMaterials';
import type { TextMaterial, TextMaterialType } from '../types/material';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';
import { getProject } from './projectService';

const MATERIALS_STORAGE_KEY = 'text-master:materials';
const SERVICE_NAME = 'materialService';

export async function listMaterials(projectId?: string): Promise<TextMaterial[]> {
  return runServiceAction(SERVICE_NAME, 'listMaterials', () =>
    readMaterials()
      .filter((material) => !projectId || material.projectId === projectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export async function getMaterial(
  materialId: string,
): Promise<TextMaterial | null> {
  return runServiceAction(SERVICE_NAME, 'getMaterial', () => {
    assertMaterialId(materialId);

    return readMaterials().find((item) => item.id === materialId) ?? null;
  });
}

export type SaveMaterialInput = {
  id?: string;
  projectId: string;
  title: string;
  type: TextMaterialType;
  content: string;
  tags?: string[];
  usageCount?: number;
  createdAt?: string;
};

export async function saveMaterial(
  material: TextMaterial | SaveMaterialInput,
): Promise<TextMaterial> {
  return runServiceAction(SERVICE_NAME, 'saveMaterial', async () => {
    assertProjectId(material.projectId);
    const project = await getProject(material.projectId);

    if (!project) {
      throw new Error(`Project not found: ${material.projectId}`);
    }

    const title = material.title.trim();

    if (!title) {
      throw new Error('Material title is required');
    }

    const now = new Date().toISOString();
    const materials = readMaterials();
    const existing = material.id
      ? materials.find((item) => item.id === material.id)
      : undefined;
    const nextMaterial: TextMaterial = {
      id: material.id ?? createTextMasterId('material'),
      projectId: material.projectId,
      title,
      type: material.type,
      content: material.content,
      tags: [...(material.tags ?? [])],
      usageCount: material.usageCount ?? existing?.usageCount ?? 0,
      createdAt: existing?.createdAt ?? material.createdAt ?? now,
      updatedAt: now,
    };
    const index = materials.findIndex((item) => item.id === nextMaterial.id);

    if (index >= 0) {
      materials[index] = nextMaterial;
    } else {
      materials.unshift(nextMaterial);
    }

    writeMaterials(materials);

    return cloneValue(nextMaterial);
  });
}

export async function incrementMaterialUsage(
  materialId: string,
): Promise<TextMaterial> {
  return runServiceAction(SERVICE_NAME, 'incrementMaterialUsage', async () => {
    const material = await getMaterial(materialId);

    if (!material) {
      throw new Error(`Material not found: ${materialId}`);
    }

    return saveMaterial({
      ...material,
      usageCount: material.usageCount + 1,
    });
  });
}

function readMaterials(): TextMaterial[] {
  return readCollection<TextMaterial>(
    MATERIALS_STORAGE_KEY,
    mockMaterials,
    SERVICE_NAME,
  ).map(normalizeMaterial);
}

function writeMaterials(materials: TextMaterial[]): void {
  writeCollection(
    MATERIALS_STORAGE_KEY,
    materials.map(normalizeMaterial),
    SERVICE_NAME,
  );
}

function normalizeMaterial(material: TextMaterial): TextMaterial {
  return {
    ...material,
    title: material.title.trim(),
    content: material.content ?? '',
    tags: [...(material.tags ?? [])],
    usageCount: Math.max(0, Math.round(material.usageCount ?? 0)),
  };
}

function assertProjectId(projectId: string): void {
  if (!projectId?.trim()) {
    throw new Error('Project id is required');
  }
}

function assertMaterialId(materialId: string): void {
  if (!materialId?.trim()) {
    throw new Error('Material id is required');
  }
}
