package com.cybergame.repository;

import com.cybergame.entity.MaintenanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceHistoryRepository extends JpaRepository<MaintenanceHistory, Integer> {

    List<MaintenanceHistory> findByMachineId(Integer machineId);
}
