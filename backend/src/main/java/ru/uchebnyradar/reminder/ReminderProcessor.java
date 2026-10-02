package ru.uchebnyradar.reminder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.notification.NotificationEntity;
import ru.uchebnyradar.notification.NotificationRepository;
import ru.uchebnyradar.task.TaskEntity;
import ru.uchebnyradar.task.TaskRepository;
import ru.uchebnyradar.task.TaskStatus;

import java.time.Instant;

@Service
public class ReminderProcessor {

    private static final Logger log = LoggerFactory.getLogger(ReminderProcessor.class);

    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;

    public ReminderProcessor(TaskRepository taskRepository,
                             NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean processTaskReminder(Long taskId) {
        TaskEntity task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            log.warn("Task id: {} no longer exists, skipping reminder", taskId);
            return false;
        }

        if (task.getStatus() == TaskStatus.COMPLETED) {
            log.debug("Task id: {} is already completed, skipping reminder", taskId);
            return false;
        }

        if (task.getReminderSentAt() != null) {
            log.debug("Reminder already marked sent for task id: {}", taskId);
            return false;
        }

        Instant now = Instant.now();
        UserEntity owner = task.getProject().getOwner();

        try {
            if (!notificationRepository.existsByTaskId(task.getId())) {
                String notificationTitle = "Напоминание о задаче: " + task.getTitle();
                NotificationEntity notification = new NotificationEntity(owner, task, notificationTitle);
                notificationRepository.save(notification);
                log.info("Created notification for task id: {}, user id: {}", task.getId(), owner.getId());
            }

            task.setReminderSentAt(now);
            taskRepository.save(task);
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.warn("Notification already exists for task id: {}, marking reminder as sent", task.getId());
            task.setReminderSentAt(now);
            taskRepository.save(task);
            return true;
        } catch (Exception ex) {
            log.error("Failed to process reminder for task id: {}", task.getId(), ex);
            return false;
        }
    }
}
