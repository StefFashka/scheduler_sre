package ru.uchebnyradar.dashboard;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.uchebnyradar.notification.NotificationRepository;
import ru.uchebnyradar.notification.NotificationResponse;
import ru.uchebnyradar.task.TaskRepository;
import ru.uchebnyradar.task.TaskResponse;
import ru.uchebnyradar.task.TaskStatus;

import java.time.Instant;
import java.util.List;

@Service
public class UpcomingTasksService {

    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;

    public UpcomingTasksService(TaskRepository taskRepository,
                                NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        Instant now = Instant.now();

        Pageable upcomingPageable = PageRequest.of(
                0,
                3,
                Sort.by(Sort.Order.asc("dueAt").nullsLast(), Sort.Order.asc("id"))
        );

        List<TaskResponse> upcoming = taskRepository.findAllByProjectOwnerIdAndStatusNot(
                userId,
                TaskStatus.COMPLETED,
                upcomingPageable
        ).stream()
                .map(TaskResponse::fromEntity)
                .toList();

        List<TaskResponse> overdue = taskRepository.findAllByProjectOwnerIdAndStatusNotAndDueAtLessThanOrderByDueAtAsc(
                userId,
                TaskStatus.COMPLETED,
                now
        ).stream()
                .map(TaskResponse::fromEntity)
                .toList();

        List<NotificationResponse> unreadNotifications = notificationRepository
                .findAllByRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(userId, PageRequest.of(0, 10))
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        return new DashboardResponse(upcoming, overdue, unreadNotifications);
    }
}
