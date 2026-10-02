package ru.uchebnyradar.project;

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
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Management of learning projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    @Operation(summary = "Get user projects", description = "Returns a list of all projects belonging to the authenticated user")
    public ResponseEntity<List<ProjectResponse>> getProjects(@CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(projectService.getProjects(currentUser.getId()));
    }

    @PostMapping
    @Operation(summary = "Create project", description = "Creates a new project for the authenticated user")
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request,
                                                         @CurrentUser CustomUserDetails currentUser) {
        ProjectResponse response = projectService.createProject(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{projectId}")
    @Operation(summary = "Get project details", description = "Retrieves details of a project owned by the user")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long projectId,
                                                      @CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(projectService.getProject(projectId, currentUser.getId()));
    }

    @PatchMapping("/{projectId}")
    @Operation(summary = "Update project", description = "Updates fields of an existing project")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long projectId,
                                                         @Valid @RequestBody UpdateProjectRequest request,
                                                         @CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(projectService.updateProject(projectId, request, currentUser.getId()));
    }

    @DeleteMapping("/{projectId}")
    @Operation(summary = "Delete project", description = "Deletes a project and all associated tasks and notifications")
    public ResponseEntity<Void> deleteProject(@PathVariable Long projectId,
                                              @CurrentUser CustomUserDetails currentUser) {
        projectService.deleteProject(projectId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
