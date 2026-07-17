package com.cybergame.service.impl;

import com.cybergame.dto.request.ReservationCreateRequest;
import com.cybergame.dto.request.ReservationStatusUpdateRequest;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.ReservationResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.Machine;
import com.cybergame.entity.Reservation;
import com.cybergame.entity.enums.MachineStatus;
import com.cybergame.entity.enums.ReservationStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.MachineMapper;
import com.cybergame.mapper.ReservationMapper;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.MachineRepository;
import com.cybergame.repository.MachineSpecifications;
import com.cybergame.repository.ReservationRepository;
import com.cybergame.repository.ReservationSpecifications;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private static final Set<ReservationStatus> ACTIVE_STATUSES = Set.of(
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED
    );

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final MachineRepository machineRepository;
    private final ReservationMapper reservationMapper;
    private final MachineMapper machineMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservations(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            ReservationStatus status,
            Pageable pageable
    ) {
        Integer effectiveCustomerId = canManageReservations(currentUser)
                ? customerId
                : getCurrentCustomer(currentUser).getId();

        Specification<Reservation> specification = Specification
                .where(ReservationSpecifications.hasKeyword(keyword))
                .and(ReservationSpecifications.hasCustomer(effectiveCustomerId))
                .and(ReservationSpecifications.hasStatus(status));

        return reservationRepository.findAll(specification, pageable)
                .map(reservationMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservation(CurrentUser currentUser, Integer id) {
        Reservation reservation = getReservationById(id);
        validateCanAccess(currentUser, reservation);
        return reservationMapper.toResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse createReservation(CurrentUser currentUser, ReservationCreateRequest request) {
        Customer customer = resolveCustomer(currentUser, request.customerId());
        Set<Machine> machines = getReservableMachines(request.machineIds());

        Reservation reservation = new Reservation();
        reservation.setCustomer(customer);
        reservation.setReservedAt(LocalDateTime.now());
        reservation.setExpiresAt(request.expiresAt());
        reservation.setDeposit(request.deposit() == null ? BigDecimal.ZERO : request.deposit());
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setMachines(machines);

        machines.forEach(machine -> machine.setStatus(MachineStatus.RESERVED));
        Reservation savedReservation = reservationRepository.save(reservation);
        machineRepository.saveAll(machines);

        return reservationMapper.toResponse(savedReservation);
    }

    @Override
    @Transactional
    public ReservationResponse updateStatus(
            CurrentUser currentUser,
            Integer id,
            ReservationStatusUpdateRequest request
    ) {
        if (!canManageReservations(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only admin or employee can update reservation status");
        }

        Reservation reservation = getReservationById(id);
        reservation.setStatus(request.status());
        syncMachineStatus(reservation);
        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public MessageResponse cancelReservation(CurrentUser currentUser, Integer id) {
        Reservation reservation = getReservationById(id);
        validateCanAccess(currentUser, reservation);

        if (isTerminalStatus(reservation.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Reservation is already closed");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        syncMachineStatus(reservation);
        reservationRepository.save(reservation);
        return new MessageResponse("Reservation has been cancelled");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MachineResponse> getAvailableMachines(String keyword, Integer areaId, Pageable pageable) {
        Specification<Machine> specification = Specification
                .where(MachineSpecifications.hasKeyword(keyword))
                .and(MachineSpecifications.hasArea(areaId))
                .and(MachineSpecifications.hasStatus(MachineStatus.AVAILABLE));

        return machineRepository.findAll(specification, pageable)
                .map(machineMapper::toResponse);
    }

    @Override
    public List<String> getStatuses() {
        return Arrays.stream(ReservationStatus.values())
                .map(Enum::name)
                .toList();
    }

    private Reservation getReservationById(Integer id) {
        return reservationRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
    }

    private Customer resolveCustomer(CurrentUser currentUser, Integer requestCustomerId) {
        if (canManageReservations(currentUser)) {
            if (requestCustomerId == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Customer id is required");
            }
            return customerRepository.findById(requestCustomerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (requestCustomerId != null && !currentCustomer.getId().equals(requestCustomerId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customer can only create reservation for own account");
        }
        return currentCustomer;
    }

    private Customer getCurrentCustomer(CurrentUser currentUser) {
        return customerRepository.findByUserId(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
    }

    private Set<Machine> getReservableMachines(Set<Integer> machineIds) {
        Set<Integer> normalizedMachineIds = new LinkedHashSet<>(machineIds);
        List<Machine> foundMachines = machineRepository.findAllById(normalizedMachineIds);

        if (foundMachines.size() != normalizedMachineIds.size()) {
            throw new ResourceNotFoundException("One or more machines were not found");
        }

        boolean hasUnavailableMachine = foundMachines.stream()
                .anyMatch(machine -> machine.getStatus() != MachineStatus.AVAILABLE);
        if (hasUnavailableMachine) {
            throw new BusinessException(HttpStatus.CONFLICT, "One or more machines are not available");
        }

        if (reservationRepository.existsActiveReservationForMachines(normalizedMachineIds, ACTIVE_STATUSES)) {
            throw new BusinessException(HttpStatus.CONFLICT, "One or more machines already have active reservation");
        }

        return new LinkedHashSet<>(foundMachines);
    }

    private void validateCanAccess(CurrentUser currentUser, Reservation reservation) {
        if (canManageReservations(currentUser)) {
            return;
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!reservation.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Reservation does not belong to current customer");
        }
    }

    private void syncMachineStatus(Reservation reservation) {
        MachineStatus nextStatus = ACTIVE_STATUSES.contains(reservation.getStatus())
                ? MachineStatus.RESERVED
                : MachineStatus.AVAILABLE;

        reservation.getMachines().forEach(machine -> {
            if (machine.getStatus() == MachineStatus.RESERVED || nextStatus == MachineStatus.RESERVED) {
                machine.setStatus(nextStatus);
            }
        });
        machineRepository.saveAll(reservation.getMachines());
    }

    private boolean canManageReservations(CurrentUser currentUser) {
        return currentUser.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority) || "ROLE_EMPLOYEE".equals(authority));
    }

    private boolean isTerminalStatus(ReservationStatus status) {
        return status == ReservationStatus.CANCELLED
                || status == ReservationStatus.EXPIRED
                || status == ReservationStatus.COMPLETED;
    }
}
