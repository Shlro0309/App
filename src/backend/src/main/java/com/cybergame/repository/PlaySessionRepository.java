package com.cybergame.repository;

import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.PlaySessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlaySessionRepository extends JpaRepository<PlaySession, Integer> {

    List<PlaySession> findByCustomerId(Integer customerId);

    Optional<PlaySession> findFirstByMachineIdAndStatus(Integer machineId, PlaySessionStatus status);
}
