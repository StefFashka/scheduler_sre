package ru.uchebnyradar;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.notification.NotificationEntity;
import ru.uchebnyradar.notification.NotificationRepository;
import ru.uchebnyradar.project.ProjectEntity;
import ru.uchebnyradar.project.ProjectStatus;
import ru.uchebnyradar.reminder.ReminderProcessor;
import ru.uchebnyradar.reminder.ReminderWorker;
import ru.uchebnyradar.task.TaskEntity;
import ru.uchebnyradar.task.TaskPriority;
import ru.uchebnyradar.task.TaskRepository;
import ru.uchebnyradar.task.TaskStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReminderWorkerTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ReminderProcessor reminderProcessor;

    private SimpleMeterRegistry meterRegistry;
    private UserEntity user;
    private ProjectEntity project;
    private TaskEntity task;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();

        user = new UserEntity("alex", "pwd");
        user.setId(1L);

        project = new ProjectEntity(user, "Math", "Desc", ProjectStatus.ACTIVE);
        project.setId(10L);

        task = new TaskEntity(project, "Exam", "Desc", TaskStatus.TODO, TaskPriority.HIGH,
                Instant.now().plus(1, ChronoUnit.HOURS),
                Instant.now().minus(5, ChronoUnit.MINUTES));
        task.setId(100L);
    }

    @Test
    void reminderProcessor_createsNotification_andSetsReminderSentAt() {
        ReminderProcessor processor = new ReminderProcessor(taskRepository, notificationRepository);
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(notificationRepository.existsByTaskId(100L)).thenReturn(false);

        boolean result = processor.processTaskReminder(100L);

        assertTrue(result);
        assertNotNull(task.getReminderSentAt());
        verify(notificationRepository).save(any(NotificationEntity.class));
        verify(taskRepository).save(task);
    }

    @Test
    void reminderProcessor_skipsCompletedTask() {
        task.setStatus(TaskStatus.COMPLETED);
        ReminderProcessor processor = new ReminderProcessor(taskRepository, notificationRepository);
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));

        boolean result = processor.processTaskReminder(100L);

        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void reminderWorker_processesTasksDue() {
        ReminderWorker worker = new ReminderWorker(taskRepository, reminderProcessor, meterRegistry);

        when(taskRepository.findAllByStatusNotAndRemindAtLessThanEqualAndReminderSentAtIsNull(eq(TaskStatus.COMPLETED), any(Instant.class)))
                .thenReturn(List.of(task));
        when(reminderProcessor.processTaskReminder(100L)).thenReturn(true);

        worker.processReminders();

        verify(reminderProcessor).processTaskReminder(100L);
        assertEquals(1.0, meterRegistry.get("reminders_processed_total").counter().count());
    }
}
