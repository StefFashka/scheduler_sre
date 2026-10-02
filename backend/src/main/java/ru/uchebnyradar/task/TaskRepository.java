package ru.uchebnyradar.task;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

    List<TaskEntity> findAllByProjectIdAndProjectOwnerIdOrderByCreatedAtDesc(Long projectId, Long ownerId);

    Optional<TaskEntity> findByIdAndProjectOwnerId(Long id, Long ownerId);

    @EntityGraph(attributePaths = {"project"})
    List<TaskEntity> findAllByProjectOwnerIdAndStatusNot(Long ownerId, TaskStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"project"})
    List<TaskEntity> findAllByProjectOwnerIdAndStatusNotAndDueAtLessThanOrderByDueAtAsc(Long ownerId, TaskStatus status, Instant now);

    @EntityGraph(attributePaths = {"project", "project.owner"})
    List<TaskEntity> findAllByStatusNotAndRemindAtLessThanEqualAndReminderSentAtIsNull(TaskStatus status, Instant now);
}
