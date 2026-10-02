import { apiClient } from '../../shared/api/apiClient';
import type { Project, ProjectRequest, UpdateProjectRequest } from '../../shared/types';

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    return apiClient.get<Project[]>('/api/projects');
  },

  async getProject(projectId: number): Promise<Project> {
    return apiClient.get<Project>(`/api/projects/${projectId}`);
  },

  async createProject(data: ProjectRequest): Promise<Project> {
    return apiClient.post<Project>('/api/projects', data);
  },

  async updateProject(projectId: number, data: UpdateProjectRequest): Promise<Project> {
    return apiClient.patch<Project>(`/api/projects/${projectId}`, data);
  },

  async deleteProject(projectId: number): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${projectId}`);
  },
};
