package ru.uchebnyradar.dashboard;

import ru.uchebnyradar.notification.NotificationResponse;
import ru.uchebnyradar.task.TaskResponse;

import java.util.List;

public class DashboardResponse {
    private List<TaskResponse> upcomingTasks;
    private List<TaskResponse> overdueTasks;
    private List<NotificationResponse> unreadNotifications;

    public DashboardResponse() {
    }

    public DashboardResponse(List<TaskResponse> upcomingTasks,
                             List<TaskResponse> overdueTasks,
                             List<NotificationResponse> unreadNotifications) {
        this.upcomingTasks = upcomingTasks;
        this.overdueTasks = overdueTasks;
        this.unreadNotifications = unreadNotifications;
    }

    public List<TaskResponse> getUpcomingTasks() {
        return upcomingTasks;
    }

    public void setUpcomingTasks(List<TaskResponse> upcomingTasks) {
        this.upcomingTasks = upcomingTasks;
    }

    public List<TaskResponse> getOverdueTasks() {
        return overdueTasks;
    }

    public void setOverdueTasks(List<TaskResponse> overdueTasks) {
        this.overdueTasks = overdueTasks;
    }

    public List<NotificationResponse> getUnreadNotifications() {
        return unreadNotifications;
    }

    public void setUnreadNotifications(List<NotificationResponse> unreadNotifications) {
        this.unreadNotifications = unreadNotifications;
    }
}
