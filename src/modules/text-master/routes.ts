import type { Component } from 'vue';
import Exports from './pages/Exports.vue';
import Home from './pages/Home.vue';
import ProjectCenter from './pages/ProjectCenter.vue';
import ProjectCreate from './pages/ProjectCreate.vue';
import ProjectWorkspace from './pages/ProjectWorkspace.vue';
import Settings from './pages/Settings.vue';
import Templates from './pages/Templates.vue';

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
  component: Component;
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
    component: Home,
    meta: {
      appId: 'text-master',
      title: 'Home',
    },
  },
  {
    path: textMasterRoutePaths.projectCenter,
    name: 'text-master-project-center',
    component: ProjectCenter,
    meta: {
      appId: 'text-master',
      title: 'Project Center',
    },
  },
  {
    path: textMasterRoutePaths.projectCreate,
    name: 'text-master-project-create',
    component: ProjectCreate,
    meta: {
      appId: 'text-master',
      title: 'Create Project',
    },
  },
  {
    path: textMasterRoutePaths.projectWorkspace,
    name: 'text-master-project-workspace',
    component: ProjectWorkspace,
    meta: {
      appId: 'text-master',
      title: 'Project Workspace',
    },
  },
  {
    path: textMasterRoutePaths.templates,
    name: 'text-master-templates',
    component: Templates,
    meta: {
      appId: 'text-master',
      title: 'Templates',
    },
  },
  {
    path: textMasterRoutePaths.exports,
    name: 'text-master-exports',
    component: Exports,
    meta: {
      appId: 'text-master',
      title: 'Exports',
    },
  },
  {
    path: textMasterRoutePaths.settings,
    name: 'text-master-settings',
    component: Settings,
    meta: {
      appId: 'text-master',
      title: 'Settings',
    },
  },
];
