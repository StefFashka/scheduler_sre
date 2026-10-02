package ru.uchebnyradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.dashboard.DashboardResponse;
import ru.uchebnyradar.dashboard.UpcomingTasksService;
import ru.uchebnyradar.notification.NotificationEntity;
import ru.uchebnyradar.notification.NotificationRepository;
import ru.uchebnyradar.project.ProjectEntity;
import ru.uchebnyradar.project.ProjectStatus;
import ru.uchebnyradar.task.TaskEntity;
import ru.uchebnyradar.task.TaskPriority;
import ru.uchebnyradar.task.TaskRepository;
import ru.uchebnyradar.task.TaskStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpcomingTasksServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private UpcomingTasksService upcomingTasksService;

    private UserEntity user;
    private ProjectEntity project;
    private TaskEntity upcomingTask;
    private TaskEntity overdueTask;
    private NotificationEntity unreadNotification;

    @BeforeEach
    void setUp() {
        user = new UserEntity("alex", "pwd");
        user.setId(1L);

        project = new ProjectEntity(user, "Math", "Desc", ProjectStatus.ACTIVE);
        project.setId(10L);

        upcomingTask = new TaskEntity(project, "Upcoming Task", "Desc", TaskStatus.TODO, TaskPriority.MEDIUM,
                Instant.now().plus(2, ChronoUnit.DAYS), null);
        upcomingTask.setId(101L);

        overdueTask = new TaskEntity(project, "Overdue Task", "Desc", TaskStatus.IN_PROGRESS, TaskPriority.HIGH,
                Instant.now().minus(1, ChronoUnit.DAYS), null);
        overdueTask.setId(102L);

        unreadNotification = new NotificationEntity(user, upcomingTask, "Notification 1");
        unreadNotification.setId(50L);
    }

    @Test
    void getDashboard_returnsAggregatedData() {
        when(taskRepository.findAllByProjectOwnerIdAndStatusNot(eq(1L), eq(TaskStatus.COMPLETED), any(Pageable.class)))
                .thenReturn(List.of(upcomingTask));
        when(taskRepository.findAllByProjectOwnerIdAndStatusNotAndDueAtLessThanOrderByDueAtAsc(eq(1L), eq(TaskStatus.COMPLETED), any(Instant.class)))
                .thenReturn(List.of(overdueTask));
        when(notificationRepository.findAllByRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(unreadNotification));

        DashboardResponse dashboard = upcomingTasksService.getDashboard(1L);

        assertNotNull(dashboard);
        assertEquals(1, dashboard.getUpcomingTasks().size());
        assertEquals("Upcoming Task", dashboard.getUpcomingTasks().get(0).getTitle());
        assertEquals(1, dashboard.getOverdueTasks().size());
        assertEquals("Overdue Task", dashboard.getOverdueTasks().get(0).getTitle());
        assertEquals(1, dashboard.getUnreadNotifications().size());
        assertEquals(50L, dashboard.getUnreadNotifications().get(0).getId());
    }
}
