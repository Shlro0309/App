package com.cybergame.repository;

import com.cybergame.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Integer> {

    Optional<Membership> findByCustomerId(Integer customerId);
}
