export type BrainHubManifestCategory = 'content-production';

export type BrainHubManifestCapability =
  | 'standalone-launch'
  | 'local-runtime'
  | 'mock-ai'
  | 'local-export'
  | 'project-sync-stub'
  | 'usage-reporting-stub'
  | 'text.project.create'
  | 'text.outline.generate'
  | 'text.content.generate'
  | 'text.rewrite'
  | 'text.review'
  | 'text.export';

export type BrainHubOptionalPermission =
  | 'profile:read'
  | 'workspace:read'
  | 'files:write'
  | 'ai:generate'
  | 'projects:sync'
  | 'usage:write';

export type BrainHubAppManifest = {
  id: 'text-master';
  name: 'Text Master';
  displayName: 'Text Master 文本工厂';
  version: string;
  category: BrainHubManifestCategory;
  entry: string;
  icon: string;
  description: string;
  capabilities: BrainHubManifestCapability[];
  optionalPermissions: BrainHubOptionalPermission[];
};

export const textMasterBrainHubManifest: BrainHubAppManifest = {
  id: 'text-master',
  name: 'Text Master',
  displayName: 'Text Master 文本工厂',
  version: '0.2.0',
  category: 'content-production',
  entry: '/',
  icon: 'text-master',
  description:
    'Standalone-first text production app with optional Brain Hub launch and sync adapters.',
  capabilities: [
    'standalone-launch',
    'local-runtime',
    'mock-ai',
    'local-export',
    'project-sync-stub',
    'usage-reporting-stub',
    'text.project.create',
    'text.outline.generate',
    'text.content.generate',
    'text.rewrite',
    'text.review',
    'text.export',
  ],
  optionalPermissions: [
    'profile:read',
    'workspace:read',
    'files:write',
    'ai:generate',
    'projects:sync',
    'usage:write',
  ],
};

export function getTextMasterBrainHubManifest(): BrainHubAppManifest {
  return textMasterBrainHubManifest;
}
