package com.cybergame.repository;

import com.cybergame.entity.Reservation;
import com.cybergame.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

public interface ReservationRepository extends JpaRepository<Reservation, Integer>, JpaSpecificationExecutor<Reservation> {

    List<Reservation> findByCustomerId(Integer customerId);

    List<Reservation> findByStatus(ReservationStatus status);

    long countByStatus(ReservationStatus status);

    long countByReservedAtGreaterThanEqualAndReservedAtLessThan(LocalDateTime start, LocalDateTime end);

    long countByStatusAndReservedAtGreaterThanEqualAndReservedAtLessThan(
            ReservationStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    @EntityGraph(attributePaths = {"customer", "customer.user", "machines", "machines.area"})
    @Query("select reservation from Reservation reservation where reservation.id = :id")
    Optional<Reservation> findDetailedById(@Param("id") Integer id);

    @EntityGraph(attributePaths = {"machines", "machines.area"})
    @Query("""
            select reservation
            from Reservation reservation
            join reservation.machines machine
            where machine.id = :machineId
              and reservation.status = :status
              and reservation.expiresAt > :now
            order by reservation.expiresAt asc
            """)
    List<Reservation> findActiveStationReservations(
            @Param("machineId") Integer machineId,
            @Param("status") ReservationStatus status,
            @Param("now") LocalDateTime now
    );

    @Query("""
            select count(reservation) > 0
            from Reservation reservation
            join reservation.machines machine
            where machine.id in :machineIds
              and reservation.status in :activeStatuses
            """)
    boolean existsActiveReservationForMachines(
            @Param("machineIds") Set<Integer> machineIds,
            @Param("activeStatuses") Set<ReservationStatus> activeStatuses
    );
}
