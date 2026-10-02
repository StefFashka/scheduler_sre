package ru.uchebnyradar.reminder;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ru.uchebnyradar.task.TaskEntity;
import ru.uchebnyradar.task.TaskRepository;
import ru.uchebnyradar.task.TaskStatus;

import java.time.Instant;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.worker.enabled", havingValue = "true", matchIfMissing = true)
public class ReminderWorker {

    private static final Logger log = LoggerFactory.getLogger(ReminderWorker.class);

    private final TaskRepository taskRepository;
    private final ReminderProcessor reminderProcessor;
    private final Counter remindersCounter;

    public ReminderWorker(TaskRepository taskRepository,
                          ReminderProcessor reminderProcessor,
                          MeterRegistry meterRegistry) {
        this.taskRepository = taskRepository;
        this.reminderProcessor = reminderProcessor;
        this.remindersCounter = Counter.builder("reminders_processed_total")
                .description("Total number of task deadline reminders successfully processed and notified")
                .register(meterRegistry);
    }

    @Scheduled(fixedRateString = "${app.worker.fixed-rate:60000}")
    public void processReminders() {
        String appRole = System.getenv("APP_ROLE");
        if ("api".equalsIgnoreCase(appRole)) {
            log.trace("ReminderWorker skipped because APP_ROLE is set to 'api'");
            return;
        }

        Instant now = Instant.now();
        log.debug("ReminderWorker running deadline check at {}", now);

        try {
            List<TaskEntity> tasksDue = taskRepository.findAllByStatusNotAndRemindAtLessThanEqualAndReminderSentAtIsNull(
                    TaskStatus.COMPLETED,
                    now
            );
            if (tasksDue.isEmpty()) {
                log.debug("No pending task reminders found at this interval");
                return;
            }

            log.info("Found {} tasks due for deadline reminders", tasksDue.size());
            int processedCount = 0;

            for (TaskEntity task : tasksDue) {
                boolean success = reminderProcessor.processTaskReminder(task.getId());
                if (success) {
                    remindersCounter.increment();
                    processedCount++;
                }
            }

            log.info("Finished reminder check. Successfully processed {}/{} reminders", processedCount, tasksDue.size());
        } catch (Exception ex) {
            log.error("Unexpected error in ReminderWorker cycle", ex);
        }
    }
}
