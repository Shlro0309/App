package com.cybergame.repository;

import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.PlaySessionStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlaySessionRepository extends JpaRepository<PlaySession, Integer>, JpaSpecificationExecutor<PlaySession> {

    List<PlaySession> findByCustomerId(Integer customerId);

    Optional<PlaySession> findFirstByMachineIdAndStatus(Integer machineId, PlaySessionStatus status);

    boolean existsByMachineIdAndStatus(Integer machineId, PlaySessionStatus status);

    @EntityGraph(attributePaths = {"customer", "customer.user", "machine", "machine.area"})
    @Query("select playSession from PlaySession playSession where playSession.id = :id")
    Optional<PlaySession> findDetailedById(@Param("id") Integer id);
}
