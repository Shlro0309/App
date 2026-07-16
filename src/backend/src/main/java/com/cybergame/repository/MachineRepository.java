package com.cybergame.repository;

import com.cybergame.entity.Machine;
import com.cybergame.entity.enums.MachineStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MachineRepository extends JpaRepository<Machine, Integer> {

    List<Machine> findByStatus(MachineStatus status);

    List<Machine> findByAreaId(Integer areaId);
}
