package ru.uchebnyradar.notification;

import java.time.Instant;

public class NotificationResponse {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private String title;
    private Instant createdAt;
    private Instant readAt;
    private boolean read;

    public NotificationResponse() {
    }

    public NotificationResponse(Long id, Long taskId, String taskTitle, String title,
                                Instant createdAt, Instant readAt) {
        this.id = id;
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.title = title;
        this.createdAt = createdAt;
        this.readAt = readAt;
        this.read = readAt != null;
    }

    public static NotificationResponse fromEntity(NotificationEntity entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getTask() != null ? entity.getTask().getId() : null,
                entity.getTask() != null ? entity.getTask().getTitle() : null,
                entity.getTitle(),
                entity.getCreatedAt(),
                entity.getReadAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
        this.read = readAt != null;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}
