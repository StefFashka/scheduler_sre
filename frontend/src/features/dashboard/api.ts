import { apiClient } from '../../shared/api/apiClient';
import type { DashboardData } from '../../shared/types';

export const dashboardApi = {
  async getDashboard(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/api/dashboard');
  },
};
