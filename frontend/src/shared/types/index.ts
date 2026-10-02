export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  name: string;
  createdAt: string;
}

export interface Project {
  id: number;
  ownerUserId: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface Task {
  id: number;
  projectId: number;
  projectName?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  remindAt?: string | null;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
  remindAt?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
  remindAt?: string | null;
}

export interface NotificationItem {
  id: number;
  taskId?: number | null;
  taskTitle?: string | null;
  title: string;
  createdAt: string;
  readAt?: string | null;
  read: boolean;
}

export interface DashboardData {
  upcomingTasks: Task[];
  overdueTasks: Task[];
  unreadNotifications: NotificationItem[];
}

export interface CsrfResponse {
  token: string;
  headerName: string;
  parameterName: string;
}

export interface ApiError {
  status?: number;
  error?: string;
  message?: string;
  errors?: Record<string, string>;
}
