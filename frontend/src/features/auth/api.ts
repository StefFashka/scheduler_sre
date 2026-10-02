import { apiClient } from '../../shared/api/apiClient';
import type { User, CsrfResponse } from '../../shared/types';
import { csrfService } from '../../shared/csrf/csrfService';

export interface AuthCredentials {
  name: string;
  password: string;
}

export const authApi = {
  async getCsrf(): Promise<CsrfResponse> {
    return apiClient.get<CsrfResponse>('/api/auth/csrf');
  },

  async login(credentials: AuthCredentials): Promise<User> {
    await csrfService.fetchToken();
    return apiClient.post<User>('/api/auth/login', credentials);
  },

  async register(credentials: AuthCredentials): Promise<User> {
    await csrfService.fetchToken();
    return apiClient.post<User>('/api/auth/register', credentials);
  },

  async logout(): Promise<void> {
    await apiClient.post<{ message: string }>('/api/auth/logout');
    csrfService.clearToken();
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  },
};
