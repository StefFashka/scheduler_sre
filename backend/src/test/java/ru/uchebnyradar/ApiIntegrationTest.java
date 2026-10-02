package ru.uchebnyradar;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ru.uchebnyradar.auth.AuthUserResponse;
import ru.uchebnyradar.auth.LoginRequest;
import ru.uchebnyradar.auth.RegisterRequest;
import ru.uchebnyradar.auth.UserEntity;
import ru.uchebnyradar.auth.UserRepository;
import ru.uchebnyradar.project.ProjectEntity;
import ru.uchebnyradar.project.ProjectRepository;
import ru.uchebnyradar.project.ProjectRequest;
import ru.uchebnyradar.project.ProjectResponse;
import ru.uchebnyradar.project.ProjectStatus;
import ru.uchebnyradar.task.CreateTaskRequest;
import ru.uchebnyradar.task.TaskEntity;
import ru.uchebnyradar.task.TaskPriority;
import ru.uchebnyradar.task.TaskRepository;
import ru.uchebnyradar.task.TaskResponse;
import ru.uchebnyradar.task.TaskStatus;
import ru.uchebnyradar.task.UpdateTaskRequest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Test
    void fullCrudAndDashboardFlow() throws Exception {
        // 1. Register user
        String username = "flow_user_" + System.currentTimeMillis();
        RegisterRequest registerReq = new RegisterRequest(username, "pass12345");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        MockHttpSession session = (MockHttpSession) regResult.getRequest().getSession(false);
        assertNotNull(session, "Session should be created upon registration");

        // 2. Check /api/auth/me
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(username));

        // 3. Create Project
        ProjectRequest projectReq = new ProjectRequest("Course Work", "Software Engineering", ProjectStatus.ACTIVE);
        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Course Work"))
                .andReturn();

        ProjectResponse project = objectMapper.readValue(projectResult.getResponse().getContentAsString(), ProjectResponse.class);
        Long projectId = project.getId();

        // 4. Create Task in Project
        CreateTaskRequest taskReq = new CreateTaskRequest("Write Documentation", "Chapters 1-3",
                TaskStatus.TODO, TaskPriority.HIGH, Instant.now().plus(2, ChronoUnit.DAYS), Instant.now().plus(1, ChronoUnit.DAYS));
        MvcResult taskResult = mockMvc.perform(post("/api/projects/" + projectId + "/tasks")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Write Documentation"))
                .andReturn();

        TaskResponse task = objectMapper.readValue(taskResult.getResponse().getContentAsString(), TaskResponse.class);
        Long taskId = task.getId();

        // 5. Update Task
        UpdateTaskRequest updateTaskReq = new UpdateTaskRequest(null, null, TaskStatus.IN_PROGRESS, null, null, null);
        mockMvc.perform(patch("/api/tasks/" + taskId)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateTaskReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 6. Check Dashboard
        mockMvc.perform(get("/api/dashboard").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upcomingTasks").isArray())
                .andExpect(jsonPath("$.upcomingTasks[0].id").value(taskId));

        // 7. Check Notifications list
        mockMvc.perform(get("/api/notifications").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 8. Delete Task
        mockMvc.perform(delete("/api/tasks/" + taskId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // 9. Delete Project
        mockMvc.perform(delete("/api/projects/" + projectId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // 10. Logout
        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void userIsolation_cannotAccessAnotherUsersProjectOrTask() throws Exception {
        // Create User 1
        String u1 = "owner1_" + System.currentTimeMillis();
        MvcResult r1 = mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(u1, "pass12345"))))
                .andExpect(status().isCreated())
                .andReturn();
        MockHttpSession session1 = (MockHttpSession) r1.getRequest().getSession(false);

        // User 1 creates project
        MvcResult pResult = mockMvc.perform(post("/api/projects")
                        .session(session1)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ProjectRequest("Secret Project", "Desc", ProjectStatus.ACTIVE))))
                .andExpect(status().isCreated())
                .andReturn();
        ProjectResponse p = objectMapper.readValue(pResult.getResponse().getContentAsString(), ProjectResponse.class);

        // Create User 2
        String u2 = "intruder_" + System.currentTimeMillis();
        MvcResult r2 = mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(u2, "pass12345"))))
                .andExpect(status().isCreated())
                .andReturn();
        MockHttpSession session2 = (MockHttpSession) r2.getRequest().getSession(false);

        // User 2 tries to get User 1's project -> 404 Not Found
        mockMvc.perform(get("/api/projects/" + p.getId()).session(session2))
                .andExpect(status().isNotFound());

        // User 2 tries to add task to User 1's project -> 404 Not Found
        CreateTaskRequest taskReq = new CreateTaskRequest("Hacked task", "Desc", TaskStatus.TODO, TaskPriority.LOW, null, null);
        mockMvc.perform(post("/api/projects/" + p.getId() + "/tasks")
                        .session(session2)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskReq)))
                .andExpect(status().isNotFound());
    }

    @Test
    void actuatorHealth_isAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}
