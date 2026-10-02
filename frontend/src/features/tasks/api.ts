import { apiClient } from '../../shared/api/apiClient';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../../shared/types';

export const tasksApi = {
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return apiClient.get<Task[]>(`/api/projects/${projectId}/tasks`);
  },

  async getTask(taskId: number): Promise<Task> {
    return apiClient.get<Task>(`/api/tasks/${taskId}`);
  },

  async createTask(projectId: number, data: CreateTaskRequest): Promise<Task> {
    return apiClient.post<Task>(`/api/projects/${projectId}/tasks`, data);
  },

  async updateTask(taskId: number, data: UpdateTaskRequest): Promise<Task> {
    return apiClient.patch<Task>(`/api/tasks/${taskId}`, data);
  },

  async deleteTask(taskId: number): Promise<void> {
    return apiClient.delete<void>(`/api/tasks/${taskId}`);
  },
};
