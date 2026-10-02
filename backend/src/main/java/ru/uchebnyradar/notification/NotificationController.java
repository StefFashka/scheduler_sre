package ru.uchebnyradar.notification;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.uchebnyradar.security.CurrentUser;
import ru.uchebnyradar.security.CustomUserDetails;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Management of in-app deadline notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Retrieves all notifications for the authenticated user, ordered from newest to oldest")
    public ResponseEntity<List<NotificationResponse>> getNotifications(@CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(notificationService.getNotifications(currentUser.getId()));
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read", description = "Sets read status and timestamp on the specified notification")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long notificationId,
                                                           @CurrentUser CustomUserDetails currentUser) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, currentUser.getId()));
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "Delete notification", description = "Deletes a notification owned by the user")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId,
                                                   @CurrentUser CustomUserDetails currentUser) {
        notificationService.deleteNotification(notificationId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
