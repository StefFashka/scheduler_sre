import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bell,
  ArrowRight,
  FolderKanban,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { dashboardApi } from '../features/dashboard/api';
import { projectsApi } from '../features/projects/api';
import { tasksApi } from '../features/tasks/api';
import { notificationsApi } from '../features/notifications/api';
import type { DashboardData, Task, Project } from '../shared/types';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { Alert } from '../shared/components/Alert';
import { formatDate, getDaysDifference } from '../shared/utils/date';
import { useNotificationCount } from '../app/providers/NotificationContext';

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupingFilter, setSelectedGroupingFilter] = useState<string>('all');
  const { setUnreadCount, refreshUnreadCount } = useNotificationCount();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dash, projList] = await Promise.all([
        dashboardApi.getDashboard(),
        projectsApi.getProjects(),
      ]);

      setDashboardData(dash);
      setProjects(projList);
      setUnreadCount(dash.unreadNotifications.length);

      const tasksPromises = projList.map((p) =>
        tasksApi.getTasksByProject(p.id).catch(() => [] as Task[])
      );
      const tasksArrays = await Promise.all(tasksPromises);
      const combinedTasks = tasksArrays.flat();
      setAllTasks(combinedTasks);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных дашборда');
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          unreadNotifications: dashboardData.unreadNotifications.filter((n) => n.id !== id),
        });
      }
      refreshUnreadCount();
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const groupedTasks = useMemo(() => {
    const now = new Date();
    const groups: {
      overdue: Task[];
      today: Task[];
      tomorrow: Task[];
      thisWeek: Task[];
      later: Task[];
      noDate: Task[];
    } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDate: [],
    };

    allTasks.forEach((task) => {
      if (task.status === 'COMPLETED') return;

      if (!task.dueAt) {
        groups.noDate.push(task);
        return;
      }

      const dueDate = new Date(task.dueAt);
      const diffDays = getDaysDifference(dueDate, now);

      if (dueDate.getTime() < now.getTime()) {
        groups.overdue.push(task);
      } else if (diffDays === 0) {
        groups.today.push(task);
      } else if (diffDays === 1) {
        groups.tomorrow.push(task);
      } else if (diffDays > 1 && diffDays <= 7) {
        groups.thisWeek.push(task);
      } else {
        groups.later.push(task);
      }
    });

    return groups;
  }, [allTasks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Загрузка сводки задач...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Радар задач</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Сводка
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Контроль приближающихся дедлайнов, просрочек и уведомлений
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Обновить
          </Button>
          <Link to="/projects">
            <Button size="sm" leftIcon={<FolderKanban className="w-3.5 h-3.5" />}>
              Все проекты
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ближайшие задачи
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {dashboardData?.upcomingTasks.length || 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">В фокусе внимания</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Просрочено
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {dashboardData?.overdueTasks.length || 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Требуют внимания</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Уведомления
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {dashboardData?.unreadNotifications.length || 0}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Непрочитанные напоминания</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Активные проекты
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {projects.filter((p) => p.status === 'ACTIVE').length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Всего: {projects.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>3 ближайшие незавершенные задачи</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Приоритетный радар дедлайнов по вашим проектам
                </p>
              </div>
            </CardHeader>

            <CardContent>
              {!dashboardData?.upcomingTasks || dashboardData.upcomingTasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Все ближайшие задачи выполнены!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Создайте новые задачи в проектах для отслеживания сроков.
                  </p>
                  <Link to="/projects" className="inline-block mt-4">
                    <Button size="sm" variant="outline">
                      Перейти к проектам
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 hover:text-indigo-600">
                            <Link to={`/projects/${task.projectId}`}>{task.title}</Link>
                          </h4>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 pl-7">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pl-7 pt-1">
                          <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {task.projectName || `Проект #${task.projectId}`}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(task.dueAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center pl-7 sm:pl-0">
                        <Badge taskPriority={task.priority} />
                        <Badge taskStatus={task.status} />
                        <Link to={`/projects/${task.projectId}`}>
                          <Button size="sm" variant="ghost" className="p-1.5 h-8 w-8">
                            <ArrowRight className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Группировка задач по срокам</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Планирование и распределение нагрузки по периодам
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setSelectedGroupingFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    selectedGroupingFilter === 'all'
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setSelectedGroupingFilter('today')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    selectedGroupingFilter === 'today'
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Сегодня ({groupedTasks.today.length})
                </button>
                <button
                  onClick={() => setSelectedGroupingFilter('week')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    selectedGroupingFilter === 'week'
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  На неделе ({groupedTasks.thisWeek.length})
                </button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {(selectedGroupingFilter === 'all' || selectedGroupingFilter === 'today') && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Сегодня ({groupedTasks.today.length})
                      </h4>
                    </div>
                    {groupedTasks.today.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">На сегодня дедлайнов нет</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedTasks.today.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-lg hover:bg-amber-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/projects/${task.projectId}`}
                                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                              >
                                {task.title}
                              </Link>
                              <Badge taskPriority={task.priority} size="sm" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                              <span className="truncate max-w-[140px] text-indigo-600 font-medium">
                                {task.projectName}
                              </span>
                              <span>{formatDate(task.dueAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedGroupingFilter === 'all' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Завтра ({groupedTasks.tomorrow.length})
                      </h4>
                    </div>
                    {groupedTasks.tomorrow.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">На завтра задач нет</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedTasks.tomorrow.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/projects/${task.projectId}`}
                                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                              >
                                {task.title}
                              </Link>
                              <Badge taskPriority={task.priority} size="sm" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                              <span className="truncate max-w-[140px] text-indigo-600 font-medium">
                                {task.projectName}
                              </span>
                              <span>{formatDate(task.dueAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(selectedGroupingFilter === 'all' || selectedGroupingFilter === 'week') && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        На этой неделе ({groupedTasks.thisWeek.length})
                      </h4>
                    </div>
                    {groupedTasks.thisWeek.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">На этой неделе дедлайнов нет</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedTasks.thisWeek.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/projects/${task.projectId}`}
                                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                              >
                                {task.title}
                              </Link>
                              <Badge taskPriority={task.priority} size="sm" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                              <span className="truncate max-w-[140px] text-indigo-600 font-medium">
                                {task.projectName}
                              </span>
                              <span>{formatDate(task.dueAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedGroupingFilter === 'all' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Позже ({groupedTasks.later.length})
                      </h4>
                    </div>
                    {groupedTasks.later.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Задач на более поздний срок нет</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedTasks.later.slice(0, 6).map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/projects/${task.projectId}`}
                                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                              >
                                {task.title}
                              </Link>
                              <Badge taskPriority={task.priority} size="sm" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                              <span className="truncate max-w-[140px] text-indigo-600 font-medium">
                                {task.projectName}
                              </span>
                              <span>{formatDate(task.dueAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-rose-50/50 border-b border-rose-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Просроченные задачи</span>
                </CardTitle>
                <p className="text-xs text-rose-600/80 mt-0.5">
                  Дедлайн наступил, задача не завершена
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-800">
                {dashboardData?.overdueTasks.length || 0}
              </span>
            </CardHeader>

            <CardContent>
              {!dashboardData?.overdueTasks || dashboardData.overdueTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Просроченных задач нет! Отличный результат.
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-rose-50/30 border border-rose-200/80 rounded-lg hover:border-rose-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/projects/${task.projectId}`}
                          className="text-xs font-semibold text-rose-950 hover:underline"
                        >
                          {task.title}
                        </Link>
                        <Badge taskPriority={task.priority} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-rose-700/80 mt-2">
                        <span className="font-medium text-slate-700 truncate max-w-[130px]">
                          {task.projectName}
                        </span>
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-500" />
                          {formatDate(task.dueAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Непрочитанные уведомления</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Напоминания о дедлайнах
                </p>
              </div>
              <Link to="/notifications">
                <Button variant="ghost" size="sm" className="text-xs">
                  Все
                </Button>
              </Link>
            </CardHeader>

            <CardContent>
              {!dashboardData?.unreadNotifications || dashboardData.unreadNotifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Все уведомления прочитаны
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dashboardData.unreadNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                        {notif.taskTitle && (
                          <p className="text-xs text-slate-500">
                            Задача:{' '}
                            <span className="font-medium text-indigo-600">{notif.taskTitle}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">{formatDate(notif.createdAt)}</p>
                      </div>

                      <button
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
                        title="Отметить прочитанным"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
