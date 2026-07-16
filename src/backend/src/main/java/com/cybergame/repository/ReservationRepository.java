package com.cybergame.repository;

import com.cybergame.entity.Reservation;
import com.cybergame.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findByCustomerId(Integer customerId);

    List<Reservation> findByStatus(ReservationStatus status);
}
