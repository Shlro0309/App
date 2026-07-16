package com.cybergame.repository;

import com.cybergame.entity.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceItemRepository extends JpaRepository<ServiceItem, Integer> {

    List<ServiceItem> findByServiceType(String serviceType);
}
