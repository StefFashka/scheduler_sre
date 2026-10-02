package ru.uchebnyradar.project;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.auth.UserRepository;
import ru.uchebnyradar.common.ResourceNotFoundException;

import java.util.List;

@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(Long userId) {
        return projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ProjectResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long projectId, Long userId) {
        ProjectEntity project = projectRepository.findByIdAndOwnerId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, Long userId) {
        UserEntity owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        ProjectStatus status = request.getStatus() != null ? request.getStatus() : ProjectStatus.ACTIVE;
        ProjectEntity project = new ProjectEntity(owner, request.getName(), request.getDescription(), status);
        ProjectEntity saved = projectRepository.save(project);
        log.info("Created project id: {} for user id: {}", saved.getId(), userId);
        return ProjectResponse.fromEntity(saved);
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request, Long userId) {
        ProjectEntity project = projectRepository.findByIdAndOwnerId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }

        ProjectEntity updated = projectRepository.save(project);
        log.info("Updated project id: {} for user id: {}", updated.getId(), userId);
        return ProjectResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        ProjectEntity project = projectRepository.findByIdAndOwnerId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        projectRepository.delete(project);
        log.info("Deleted project id: {} by user id: {}", projectId, userId);
    }
}
