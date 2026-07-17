package com.cybergame.controller;

import com.cybergame.dto.request.ReservationCreateRequest;
import com.cybergame.dto.request.ReservationStatusUpdateRequest;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.ReservationResponse;
import com.cybergame.entity.enums.ReservationStatus;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CUSTOMER')")
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public Page<ReservationResponse> getReservations(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) ReservationStatus status,
            @PageableDefault(size = 20, sort = "reservedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return reservationService.getReservations(currentUser, keyword, customerId, status, pageable);
    }

    @GetMapping("/{id}")
    public ReservationResponse getReservation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return reservationService.getReservation(currentUser, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse createReservation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ReservationCreateRequest request
    ) {
        return reservationService.createReservation(currentUser, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ReservationResponse updateStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody ReservationStatusUpdateRequest request
    ) {
        return reservationService.updateStatus(currentUser, id, request);
    }

    @PatchMapping("/{id}/cancel")
    public MessageResponse cancelReservation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return reservationService.cancelReservation(currentUser, id);
    }

    @GetMapping("/available-machines")
    public Page<MachineResponse> getAvailableMachines(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer areaId,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return reservationService.getAvailableMachines(keyword, areaId, pageable);
    }

    @GetMapping("/statuses")
    public List<String> getStatuses() {
        return reservationService.getStatuses();
    }
}
