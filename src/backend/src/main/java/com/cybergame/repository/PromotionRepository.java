package com.cybergame.repository;

import com.cybergame.entity.Promotion;
import com.cybergame.entity.enums.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Integer> {

    List<Promotion> findByStatus(PromotionStatus status);
}
