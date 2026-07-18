package com.cybergame.service.impl;

import com.cybergame.dto.request.PlaySessionReservationStartRequest;
import com.cybergame.dto.request.PlaySessionStartRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PlaySessionResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.Machine;
import com.cybergame.entity.PlaySession;
import com.cybergame.entity.Reservation;
import com.cybergame.entity.enums.MachineStatus;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.entity.enums.ReservationStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.PlaySessionMapper;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.MachineRepository;
import com.cybergame.repository.PlaySessionRepository;
import com.cybergame.repository.PlaySessionSpecifications;
import com.cybergame.repository.ReservationRepository;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.PlaySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PlaySessionServiceImpl implements PlaySessionService {

    private final PlaySessionRepository playSessionRepository;
    private final CustomerRepository customerRepository;
    private final MachineRepository machineRepository;
    private final ReservationRepository reservationRepository;
    private final PlaySessionMapper playSessionMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<PlaySessionResponse> getPlaySessions(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            Integer machineId,
            PlaySessionStatus status,
            Pageable pageable
    ) {
        Integer effectiveCustomerId = canManagePlaySessions(currentUser)
                ? customerId
                : getCurrentCustomer(currentUser).getId();

        Specification<PlaySession> specification = Specification
                .where(PlaySessionSpecifications.hasKeyword(keyword))
                .and(PlaySessionSpecifications.hasCustomer(effectiveCustomerId))
                .and(PlaySessionSpecifications.hasMachine(machineId))
                .and(PlaySessionSpecifications.hasStatus(status));

        return playSessionRepository.findAll(specification, pageable)
                .map(playSessionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PlaySessionResponse getPlaySession(CurrentUser currentUser, Integer id) {
        PlaySession playSession = getPlaySessionById(id);
        validateCanAccess(currentUser, playSession);
        return playSessionMapper.toResponse(playSession);
    }

    @Override
    @Transactional
    public PlaySessionResponse startSession(CurrentUser currentUser, PlaySessionStartRequest request) {
        Customer customer = resolveCustomer(currentUser, request.customerId());
        Machine machine = getMachine(request.machineId());
        validateCanStartMachine(machine, Set.of(MachineStatus.AVAILABLE));

        PlaySession playSession = createActiveSession(customer, machine);
        return playSessionMapper.toResponse(playSession);
    }

    @Override
    @Transactional
    public List<PlaySessionResponse> startFromReservation(
            CurrentUser currentUser,
            PlaySessionReservationStartRequest request
    ) {
        Reservation reservation = reservationRepository.findDetailedById(request.reservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        validateCanUseReservation(currentUser, reservation);

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Reservation must be confirmed before check-in");
        }
        if (reservation.getExpiresAt().isBefore(LocalDateTime.now())) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            releaseReservedMachines(reservation.getMachines());
            reservationRepository.save(reservation);
            throw new BusinessException(HttpStatus.CONFLICT, "Reservation has expired");
        }

        Set<Integer> normalizedMachineIds = new LinkedHashSet<>(request.machineIds());
        List<Machine> selectedMachines = reservation.getMachines()
                .stream()
                .filter(machine -> normalizedMachineIds.contains(machine.getId()))
                .toList();

        if (selectedMachines.size() != normalizedMachineIds.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "One or more machines do not belong to reservation");
        }

        List<PlaySession> playSessions = selectedMachines.stream()
                .map(machine -> {
                    validateCanStartMachine(machine, Set.of(MachineStatus.RESERVED));
                    return createActiveSession(reservation.getCustomer(), machine);
                })
                .toList();

        if (reservation.getMachines().stream().noneMatch(machine -> machine.getStatus() == MachineStatus.RESERVED)) {
            reservation.setStatus(ReservationStatus.COMPLETED);
            reservationRepository.save(reservation);
        }

        return playSessions.stream()
                .map(playSessionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PlaySessionResponse endSession(CurrentUser currentUser, Integer id) {
        PlaySession playSession = getPlaySessionById(id);
        validateCanManageOrOwnActiveSession(currentUser, playSession);

        if (playSession.getStatus() != PlaySessionStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Play session is already closed");
        }

        playSession.setEndedAt(LocalDateTime.now());
        playSession.setTotalHourlyAmount(calculateHourlyAmount(playSession));
        playSession.setStatus(PlaySessionStatus.COMPLETED);
        releaseMachine(playSession.getMachine());

        return playSessionMapper.toResponse(playSessionRepository.save(playSession));
    }

    @Override
    @Transactional
    public MessageResponse cancelSession(CurrentUser currentUser, Integer id) {
        if (!canManagePlaySessions(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only admin or employee can cancel play session");
        }

        PlaySession playSession = getPlaySessionById(id);
        if (playSession.getStatus() != PlaySessionStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Play session is already closed");
        }

        playSession.setEndedAt(LocalDateTime.now());
        playSession.setTotalHourlyAmount(BigDecimal.ZERO);
        playSession.setStatus(PlaySessionStatus.CANCELLED);
        releaseMachine(playSession.getMachine());
        playSessionRepository.save(playSession);

        return new MessageResponse("Play session has been cancelled");
    }

    @Override
    public List<String> getStatuses() {
        return Arrays.stream(PlaySessionStatus.values())
                .map(Enum::name)
                .toList();
    }

    private PlaySession getPlaySessionById(Integer id) {
        return playSessionRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Play session not found"));
    }

    private Customer resolveCustomer(CurrentUser currentUser, Integer requestCustomerId) {
        if (canManagePlaySessions(currentUser)) {
            if (requestCustomerId == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Customer id is required");
            }
            return customerRepository.findById(requestCustomerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (requestCustomerId != null && !currentCustomer.getId().equals(requestCustomerId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customer can only start own play session");
        }
        return currentCustomer;
    }

    private Customer getCurrentCustomer(CurrentUser currentUser) {
        return customerRepository.findByUserId(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
    }

    private Machine getMachine(Integer machineId) {
        return machineRepository.findDetailedById(machineId)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found"));
    }

    private void validateCanStartMachine(Machine machine, Set<MachineStatus> allowedStatuses) {
        if (!allowedStatuses.contains(machine.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Machine is not ready to start play session");
        }
        if (playSessionRepository.existsByMachineIdAndStatus(machine.getId(), PlaySessionStatus.ACTIVE)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Machine already has active play session");
        }
    }

    private PlaySession createActiveSession(Customer customer, Machine machine) {
        PlaySession playSession = new PlaySession();
        playSession.setCustomer(customer);
        playSession.setMachine(machine);
        playSession.setStartedAt(LocalDateTime.now());
        playSession.setStatus(PlaySessionStatus.ACTIVE);
        playSession.setTotalHourlyAmount(BigDecimal.ZERO);

        machine.setStatus(MachineStatus.PLAYING);
        PlaySession savedPlaySession = playSessionRepository.save(playSession);
        machineRepository.save(machine);

        return savedPlaySession;
    }

    private BigDecimal calculateHourlyAmount(PlaySession playSession) {
        long minutes = Math.max(
                Duration.between(playSession.getStartedAt(), playSession.getEndedAt()).toMinutes(),
                1L
        );
        return playSession.getMachine()
                .getHourlyPrice()
                .multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private void releaseMachine(Machine machine) {
        if (machine.getStatus() == MachineStatus.PLAYING) {
            machine.setStatus(MachineStatus.AVAILABLE);
            machineRepository.save(machine);
        }
    }

    private void releaseReservedMachines(Set<Machine> machines) {
        machines.forEach(machine -> {
            if (machine.getStatus() == MachineStatus.RESERVED) {
                machine.setStatus(MachineStatus.AVAILABLE);
            }
        });
        machineRepository.saveAll(machines);
    }

    private void validateCanUseReservation(CurrentUser currentUser, Reservation reservation) {
        if (canManagePlaySessions(currentUser)) {
            return;
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!reservation.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Reservation does not belong to current customer");
        }
    }

    private void validateCanAccess(CurrentUser currentUser, PlaySession playSession) {
        if (canManagePlaySessions(currentUser)) {
            return;
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!playSession.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Play session does not belong to current customer");
        }
    }

    private void validateCanManageOrOwnActiveSession(CurrentUser currentUser, PlaySession playSession) {
        if (canManagePlaySessions(currentUser)) {
            return;
        }

        validateCanAccess(currentUser, playSession);
    }

    private boolean canManagePlaySessions(CurrentUser currentUser) {
        return currentUser.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority) || "ROLE_EMPLOYEE".equals(authority));
    }
}
