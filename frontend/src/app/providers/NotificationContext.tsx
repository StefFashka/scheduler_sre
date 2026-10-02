import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../../features/notifications/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated } = useAuth();

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const list = await notificationsApi.getNotifications();
      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // silently ignore if not authenticated or offline
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();
    // Poll notifications every 30 seconds to catch worker notifications
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationCount = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationCount must be used within a NotificationProvider');
  }
  return context;
};
