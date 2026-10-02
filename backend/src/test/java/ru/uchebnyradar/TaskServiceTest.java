package ru.uchebnyradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.common.ResourceNotFoundException;
import ru.uchebnyradar.project.ProjectEntity;
import ru.uchebnyradar.project.ProjectRepository;
import ru.uchebnyradar.project.ProjectStatus;
import ru.uchebnyradar.task.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private TaskService taskService;

    private UserEntity user;
    private ProjectEntity project;
    private TaskEntity task;

    @BeforeEach
    void setUp() {
        user = new UserEntity("alex", "hashed_pwd");
        user.setId(1L);

        project = new ProjectEntity(user, "Math", "Calculus course", ProjectStatus.ACTIVE);
        project.setId(10L);

        task = new TaskEntity(project, "Homework 1", "Problems 1-10",
                TaskStatus.TODO, TaskPriority.HIGH,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Instant.now().plus(1, ChronoUnit.DAYS));
        task.setId(100L);
    }

    @Test
    void getTasksByProject_success() {
        when(projectRepository.findByIdAndOwnerId(10L, 1L)).thenReturn(Optional.of(project));
        when(taskRepository.findAllByProjectIdAndProjectOwnerIdOrderByCreatedAtDesc(10L, 1L)).thenReturn(List.of(task));

        List<TaskResponse> tasks = taskService.getTasksByProject(10L, 1L);

        assertEquals(1, tasks.size());
        assertEquals("Homework 1", tasks.get(0).getTitle());
    }

    @Test
    void getTasksByProject_notOwner_throwsNotFound() {
        when(projectRepository.findByIdAndOwnerId(10L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTasksByProject(10L, 2L));
    }

    @Test
    void createTask_success() {
        CreateTaskRequest request = new CreateTaskRequest("Homework 2", "Problems 11-20",
                TaskStatus.TODO, TaskPriority.MEDIUM, Instant.now().plus(3, ChronoUnit.DAYS), null);
        when(projectRepository.findByIdAndOwnerId(10L, 1L)).thenReturn(Optional.of(project));
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(invocation -> {
            TaskEntity t = invocation.getArgument(0);
            t.setId(101L);
            return t;
        });

        TaskResponse response = taskService.createTask(10L, request, 1L);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("Homework 2", response.getTitle());
    }

    @Test
    void updateTask_resetsReminderSentAtWhenRemindAtChanges() {
        task.setReminderSentAt(Instant.now());
        Instant newRemindAt = Instant.now().plus(5, ChronoUnit.DAYS);
        UpdateTaskRequest request = new UpdateTaskRequest(null, null, TaskStatus.IN_PROGRESS, null, null, newRemindAt);

        when(taskRepository.findByIdAndProjectOwnerId(100L, 1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(TaskEntity.class))).thenReturn(task);

        TaskResponse response = taskService.updateTask(100L, request, 1L);

        assertEquals(TaskStatus.IN_PROGRESS, response.getStatus());
        assertNull(task.getReminderSentAt(), "reminderSentAt must be reset when remindAt is updated");
    }

    @Test
    void deleteTask_success() {
        when(taskRepository.findByIdAndProjectOwnerId(100L, 1L)).thenReturn(Optional.of(task));

        taskService.deleteTask(100L, 1L);

        verify(taskRepository).delete(task);
    }
}
