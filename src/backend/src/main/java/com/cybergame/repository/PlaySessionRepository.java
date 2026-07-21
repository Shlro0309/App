package com.cybergame.repository;

import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.PlaySessionStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PlaySessionRepository extends JpaRepository<PlaySession, Integer>, JpaSpecificationExecutor<PlaySession> {

    List<PlaySession> findByCustomerId(Integer customerId);

    Optional<PlaySession> findFirstByMachineIdAndStatus(Integer machineId, PlaySessionStatus status);

    boolean existsByMachineIdAndStatus(Integer machineId, PlaySessionStatus status);

    long countByStatus(PlaySessionStatus status);

    long countByStartedAtGreaterThanEqualAndStartedAtLessThan(LocalDateTime start, LocalDateTime end);

    long countByStatusAndStartedAtGreaterThanEqualAndStartedAtLessThan(
            PlaySessionStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    @EntityGraph(attributePaths = {"customer", "customer.user", "machine", "machine.area"})
    List<PlaySession> findTop6ByStatusOrderByStartedAtDesc(PlaySessionStatus status);

    @EntityGraph(attributePaths = {"customer", "customer.user", "machine", "machine.area"})
    List<PlaySession> findByStatus(PlaySessionStatus status);

    @EntityGraph(attributePaths = {"machine", "machine.area"})
    @Query("""
            select playSession
            from PlaySession playSession
            where playSession.status = :status
              and playSession.startedAt >= :start
              and playSession.startedAt < :end
            """)
    List<PlaySession> findDetailedByStatusAndStartedAtBetween(
            @Param("status") PlaySessionStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @EntityGraph(attributePaths = {"customer", "customer.user", "machine", "machine.area"})
    @Query("select playSession from PlaySession playSession where playSession.id = :id")
    Optional<PlaySession> findDetailedById(@Param("id") Integer id);
}
