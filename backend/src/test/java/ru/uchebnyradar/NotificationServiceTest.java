package ru.uchebnyradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.common.ResourceNotFoundException;
import ru.uchebnyradar.notification.NotificationEntity;
import ru.uchebnyradar.notification.NotificationRepository;
import ru.uchebnyradar.notification.NotificationResponse;
import ru.uchebnyradar.notification.NotificationService;
import ru.uchebnyradar.project.ProjectEntity;
import ru.uchebnyradar.project.ProjectStatus;
import ru.uchebnyradar.task.TaskEntity;
import ru.uchebnyradar.task.TaskPriority;
import ru.uchebnyradar.task.TaskStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UserEntity user;
    private NotificationEntity notification;

    @BeforeEach
    void setUp() {
        user = new UserEntity("alex", "pwd");
        user.setId(1L);

        ProjectEntity project = new ProjectEntity(user, "Math", "Desc", ProjectStatus.ACTIVE);
        TaskEntity task = new TaskEntity(project, "Exam", "Desc", TaskStatus.TODO, TaskPriority.HIGH, Instant.now(), null);
        task.setId(100L);

        notification = new NotificationEntity(user, task, "Напоминание о задаче: Exam");
        notification.setId(50L);
    }

    @Test
    void getNotifications_returnsList() {
        when(notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(notification));

        List<NotificationResponse> list = notificationService.getNotifications(1L);

        assertEquals(1, list.size());
        assertEquals(50L, list.get(0).getId());
        assertFalse(list.get(0).isRead());
    }

    @Test
    void markAsRead_success() {
        when(notificationRepository.findByIdAndRecipientId(50L, 1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(NotificationEntity.class))).thenReturn(notification);

        NotificationResponse response = notificationService.markAsRead(50L, 1L);

        assertTrue(response.isRead());
        assertNotNull(notification.getReadAt());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_notFound_throwsException() {
        when(notificationRepository.findByIdAndRecipientId(50L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead(50L, 2L));
    }

    @Test
    void deleteNotification_success() {
        when(notificationRepository.findByIdAndRecipientId(50L, 1L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification(50L, 1L);

        verify(notificationRepository).delete(notification);
    }
}
