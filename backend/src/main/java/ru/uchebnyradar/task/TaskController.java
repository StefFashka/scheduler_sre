package ru.uchebnyradar.task;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.uchebnyradar.security.CurrentUser;
import ru.uchebnyradar.security.CustomUserDetails;

import java.util.List;

@RestController
@Tag(name = "Tasks", description = "Management of tasks within projects")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    @Operation(summary = "Get project tasks", description = "Returns all tasks for the specified project owned by the user")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable Long projectId,
                                                                @CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, currentUser.getId()));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    @Operation(summary = "Create task", description = "Creates a new task in the specified project")
    public ResponseEntity<TaskResponse> createTask(@PathVariable Long projectId,
                                                   @Valid @RequestBody CreateTaskRequest request,
                                                   @CurrentUser CustomUserDetails currentUser) {
        TaskResponse response = taskService.createTask(projectId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/tasks/{taskId}")
    @Operation(summary = "Get task details", description = "Retrieves details of a specific task")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long taskId,
                                                @CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.getTask(taskId, currentUser.getId()));
    }

    @PatchMapping("/api/tasks/{taskId}")
    @Operation(summary = "Update task", description = "Updates title, description, status, priority, due date, or reminder")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long taskId,
                                                   @Valid @RequestBody UpdateTaskRequest request,
                                                   @CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, currentUser.getId()));
    }

    @DeleteMapping("/api/tasks/{taskId}")
    @Operation(summary = "Delete task", description = "Deletes a task and its associated notification")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId,
                                           @CurrentUser CustomUserDetails currentUser) {
        taskService.deleteTask(taskId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
