export type TextMasterRouteName =
  | 'text-master-home'
  | 'text-master-project-center'
  | 'text-master-project-create'
  | 'text-master-project-workspace'
  | 'text-master-templates'
  | 'text-master-exports'
  | 'text-master-settings';

export type TextMasterRouteRecord = {
  path: string;
  name: TextMasterRouteName;
  component: () => Promise<unknown>;
  meta: {
    appId: 'text-master';
    title: string;
  };
};

export const textMasterRoutePaths = {
  home: '/',
  projectCenter: '/projects',
  projectCreate: '/create',
  projectWorkspace: '/projects/:projectId',
  templates: '/templates',
  exports: '/exports',
  settings: '/settings',
} as const;

export const textMasterNavigation = [
  {
    path: textMasterRoutePaths.home,
    label: 'Home',
  },
  {
    path: textMasterRoutePaths.projectCenter,
    label: 'Projects',
  },
  {
    path: textMasterRoutePaths.projectCreate,
    label: 'Create',
  },
  {
    path: textMasterRoutePaths.templates,
    label: 'Templates',
  },
  {
    path: textMasterRoutePaths.exports,
    label: 'Exports',
  },
  {
    path: textMasterRoutePaths.settings,
    label: 'Settings',
  },
] as const;

export function getTextMasterProjectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export const textMasterRoutes: TextMasterRouteRecord[] = [
  {
    path: textMasterRoutePaths.home,
    name: 'text-master-home',
    component: () => import('./pages/Home.vue'),
    meta: {
      appId: 'text-master',
      title: 'Home',
    },
  },
  {
    path: textMasterRoutePaths.projectCenter,
    name: 'text-master-project-center',
    component: () => import('./pages/ProjectCenter.vue'),
    meta: {
      appId: 'text-master',
      title: 'Project Center',
    },
  },
  {
    path: textMasterRoutePaths.projectCreate,
    name: 'text-master-project-create',
    component: () => import('./pages/ProjectCreate.vue'),
    meta: {
      appId: 'text-master',
      title: 'Create Project',
    },
  },
  {
    path: textMasterRoutePaths.projectWorkspace,
    name: 'text-master-project-workspace',
    component: () => import('./pages/ProjectWorkspace.vue'),
    meta: {
      appId: 'text-master',
      title: 'Project Workspace',
    },
  },
  {
    path: textMasterRoutePaths.templates,
    name: 'text-master-templates',
    component: () => import('./pages/Templates.vue'),
    meta: {
      appId: 'text-master',
      title: 'Templates',
    },
  },
  {
    path: textMasterRoutePaths.exports,
    name: 'text-master-exports',
    component: () => import('./pages/Exports.vue'),
    meta: {
      appId: 'text-master',
      title: 'Exports',
    },
  },
  {
    path: textMasterRoutePaths.settings,
    name: 'text-master-settings',
    component: () => import('./pages/Settings.vue'),
    meta: {
      appId: 'text-master',
      title: 'Settings',
    },
  },
];
