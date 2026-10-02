package ru.uchebnyradar.dashboard;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.uchebnyradar.security.CurrentUser;
import ru.uchebnyradar.security.CustomUserDetails;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Aggregated dashboard with upcoming deadlines, overdue tasks, and notifications")
public class DashboardController {

    private final UpcomingTasksService upcomingTasksService;

    public DashboardController(UpcomingTasksService upcomingTasksService) {
        this.upcomingTasksService = upcomingTasksService;
    }

    @GetMapping
    @Operation(summary = "Get user dashboard", description = "Returns top 3 upcoming tasks, overdue tasks, and unread notifications")
    public ResponseEntity<DashboardResponse> getDashboard(@CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(upcomingTasksService.getDashboard(currentUser.getId()));
    }
}
