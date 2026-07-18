package com.cybergame.controller;

import com.cybergame.dto.request.PlaySessionReservationStartRequest;
import com.cybergame.dto.request.PlaySessionStartRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PlaySessionResponse;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.PlaySessionService;
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
@RequestMapping("/play-sessions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CUSTOMER')")
public class PlaySessionController {

    private final PlaySessionService playSessionService;

    @GetMapping
    public Page<PlaySessionResponse> getPlaySessions(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) Integer machineId,
            @RequestParam(required = false) PlaySessionStatus status,
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return playSessionService.getPlaySessions(currentUser, keyword, customerId, machineId, status, pageable);
    }

    @GetMapping("/{id}")
    public PlaySessionResponse getPlaySession(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return playSessionService.getPlaySession(currentUser, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaySessionResponse startSession(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody PlaySessionStartRequest request
    ) {
        return playSessionService.startSession(currentUser, request);
    }

    @PostMapping("/from-reservation")
    @ResponseStatus(HttpStatus.CREATED)
    public List<PlaySessionResponse> startFromReservation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody PlaySessionReservationStartRequest request
    ) {
        return playSessionService.startFromReservation(currentUser, request);
    }

    @PatchMapping("/{id}/end")
    public PlaySessionResponse endSession(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return playSessionService.endSession(currentUser, id);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public MessageResponse cancelSession(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return playSessionService.cancelSession(currentUser, id);
    }

    @GetMapping("/statuses")
    public List<String> getStatuses() {
        return playSessionService.getStatuses();
    }
}
