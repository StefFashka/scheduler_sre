package ru.uchebnyradar.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    List<ProjectEntity> findAllByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<ProjectEntity> findByIdAndOwnerId(Long id, Long ownerId);
}
