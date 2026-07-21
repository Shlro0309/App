package com.cybergame.repository;

import com.cybergame.entity.ServiceItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ServiceItemRepository extends JpaRepository<ServiceItem, Integer>, JpaSpecificationExecutor<ServiceItem> {

    List<ServiceItem> findByServiceType(String serviceType);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select serviceItem from ServiceItem serviceItem where serviceItem.id in :ids")
    List<ServiceItem> findAllByIdForUpdate(@Param("ids") Collection<Integer> ids);
}
