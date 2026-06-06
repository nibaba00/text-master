import {
  createProject,
  getProject,
  listProjects,
  saveProject,
} from '../services/projectService';

export function createProjectStore() {
  return {
    listProjects,
    getProject,
    createProject,
    saveProject,
  };
}
