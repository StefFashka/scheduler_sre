package ru.uchebnyradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.auth.UserRepository;
import ru.uchebnyradar.common.ResourceNotFoundException;
import ru.uchebnyradar.project.*;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    private UserEntity user;
    private ProjectEntity project;

    @BeforeEach
    void setUp() {
        user = new UserEntity("alex", "hashed_pwd");
        user.setId(1L);

        project = new ProjectEntity(user, "Math", "Calculus course", ProjectStatus.ACTIVE);
        project.setId(10L);
    }

    @Test
    void getProjects_returnsUserProjects() {
        when(projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(project));

        List<ProjectResponse> projects = projectService.getProjects(1L);

        assertEquals(1, projects.size());
        assertEquals("Math", projects.get(0).getName());
        assertEquals(1L, projects.get(0).getOwnerUserId());
    }

    @Test
    void getProject_ownProject_returnsProject() {
        when(projectRepository.findByIdAndOwnerId(10L, 1L)).thenReturn(Optional.of(project));

        ProjectResponse response = projectService.getProject(10L, 1L);

        assertNotNull(response);
        assertEquals("Math", response.getName());
    }

    @Test
    void getProject_otherUserProject_throwsNotFound() {
        when(projectRepository.findByIdAndOwnerId(10L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.getProject(10L, 2L));
    }

    @Test
    void createProject_success() {
        ProjectRequest request = new ProjectRequest("Physics", "Mechanics", ProjectStatus.ACTIVE);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(projectRepository.save(any(ProjectEntity.class))).thenAnswer(invocation -> {
            ProjectEntity p = invocation.getArgument(0);
            p.setId(11L);
            return p;
        });

        ProjectResponse response = projectService.createProject(request, 1L);

        assertNotNull(response);
        assertEquals(11L, response.getId());
        assertEquals("Physics", response.getName());
        assertEquals(1L, response.getOwnerUserId());
    }

    @Test
    void updateProject_success() {
        UpdateProjectRequest updateReq = new UpdateProjectRequest("Advanced Math", "Updated desc", ProjectStatus.COMPLETED);
        when(projectRepository.findByIdAndOwnerId(10L, 1L)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(ProjectEntity.class))).thenReturn(project);

        ProjectResponse response = projectService.updateProject(10L, updateReq, 1L);

        assertEquals("Advanced Math", response.getName());
        assertEquals(ProjectStatus.COMPLETED, response.getStatus());
    }

    @Test
    void deleteProject_success() {
        when(projectRepository.findByIdAndOwnerId(10L, 1L)).thenReturn(Optional.of(project));

        projectService.deleteProject(10L, 1L);

        verify(projectRepository).delete(project);
    }
}
