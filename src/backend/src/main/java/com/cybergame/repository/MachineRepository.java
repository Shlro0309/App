package com.cybergame.repository;

import com.cybergame.entity.Machine;
import com.cybergame.entity.enums.MachineStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, Integer>, JpaSpecificationExecutor<Machine> {

    List<Machine> findByStatus(MachineStatus status);

    List<Machine> findByAreaId(Integer areaId);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    @EntityGraph(attributePaths = "area")
    @Query("select machine from Machine machine where machine.id = :id")
    Optional<Machine> findDetailedById(@Param("id") Integer id);
}
