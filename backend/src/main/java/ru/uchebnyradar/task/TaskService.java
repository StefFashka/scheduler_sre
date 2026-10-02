package ru.uchebnyradar.task;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.uchebnyradar.common.ResourceNotFoundException;
import ru.uchebnyradar.project.ProjectEntity;
import ru.uchebnyradar.project.ProjectRepository;

import java.util.List;
import java.util.Objects;

@Service
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(Long projectId, Long userId) {
        // Strict project owner verification
        if (!projectRepository.findByIdAndOwnerId(projectId, userId).isPresent()) {
            throw new ResourceNotFoundException("Project not found: " + projectId);
        }

        return taskRepository.findAllByProjectIdAndProjectOwnerIdOrderByCreatedAtDesc(projectId, userId)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(Long taskId, Long userId) {
        TaskEntity task = taskRepository.findByIdAndProjectOwnerId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse createTask(Long projectId, CreateTaskRequest request, Long userId) {
        ProjectEntity project = projectRepository.findByIdAndOwnerId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        TaskStatus status = request.getStatus() != null ? request.getStatus() : TaskStatus.TODO;
        TaskPriority priority = request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM;

        TaskEntity task = new TaskEntity(
                project,
                request.getTitle(),
                request.getDescription(),
                status,
                priority,
                request.getDueAt(),
                request.getRemindAt()
        );

        TaskEntity saved = taskRepository.save(task);
        log.info("Created task id: {} in project id: {} by user id: {}", saved.getId(), projectId, userId);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request, Long userId) {
        TaskEntity task = taskRepository.findByIdAndProjectOwnerId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getDueAt() != null) {
            task.setDueAt(request.getDueAt());
        }
        if (request.getRemindAt() != null && !Objects.equals(task.getRemindAt(), request.getRemindAt())) {
            task.setRemindAt(request.getRemindAt());
            // Reset reminderSentAt if reminder timestamp changed
            task.setReminderSentAt(null);
        }

        TaskEntity updated = taskRepository.save(task);
        log.info("Updated task id: {} by user id: {}", updated.getId(), userId);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        TaskEntity task = taskRepository.findByIdAndProjectOwnerId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        taskRepository.delete(task);
        log.info("Deleted task id: {} by user id: {}", taskId, userId);
    }
}
