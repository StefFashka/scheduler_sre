import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Check,
  Trash2,
  CheckCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { notificationsApi } from '../features/notifications/api';
import type { NotificationItem } from '../shared/types';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { Alert } from '../shared/components/Alert';
import { formatDate } from '../shared/utils/date';
import { useNotificationCount } from '../app/providers/NotificationContext';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { setUnreadCount, refreshUnreadCount } = useNotificationCount();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await notificationsApi.getNotifications();
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const updated = await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: updated.readAt } : n))
      );
      refreshUnreadCount();
    } catch (err: any) {
      setError(err.message || 'Не удалось отметить уведомление как прочитанное');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      setMarkingAll(true);
      await Promise.all(unread.map((n) => notificationsApi.markAsRead(n.id)));
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      refreshUnreadCount();
    } catch (err: any) {
      setError(err.message || 'Ошибка при отметке всех уведомлений');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      refreshUnreadCount();
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить уведомление');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-600" />
            <span>Уведомления</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {unreadCount} новых
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Напоминания о дедлайнах и системные оповещения
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Обновить
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              isLoading={markingAll}
              leftIcon={<CheckCheck className="w-4 h-4 text-indigo-600" />}
            >
              Отметить все прочитанными
            </Button>
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-700">История уведомлений</CardTitle>
          <span className="text-xs text-slate-400">Всего: {notifications.length}</span>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Загрузка уведомлений...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Уведомлений нет</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Когда подойдёт время напоминания для задачи, здесь появится оповещение.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`py-4 px-2 -mx-2 rounded-xl transition-colors flex items-start justify-between gap-4 ${
                    !notif.read ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        !notif.read
                          ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm ${
                            !notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        )}
                      </div>

                      {notif.taskTitle && (
                        <p className="text-xs text-slate-600">
                          Задача:{' '}
                          <span className="font-semibold text-indigo-700">
                            {notif.taskTitle}
                          </span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(notif.createdAt)}
                        </span>
                        {notif.read && notif.readAt && (
                          <span>• Прочитано {formatDate(notif.readAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Отметить прочитанным"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Удалить уведомление"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
