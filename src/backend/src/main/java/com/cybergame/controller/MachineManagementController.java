package com.cybergame.controller;

import com.cybergame.dto.request.AreaUpsertRequest;
import com.cybergame.dto.request.MachineCreateRequest;
import com.cybergame.dto.request.MachineStatusUpdateRequest;
import com.cybergame.dto.request.MachineUpdateRequest;
import com.cybergame.dto.response.AreaResponse;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.entity.enums.MachineStatus;
import com.cybergame.service.MachineManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/machines")
@RequiredArgsConstructor
public class MachineManagementController {

    private final MachineManagementService machineManagementService;

    @GetMapping
    public Page<MachineResponse> getMachines(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer areaId,
            @RequestParam(required = false) MachineStatus status,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return machineManagementService.getMachines(keyword, areaId, status, pageable);
    }

    @GetMapping("/{id}")
    public MachineResponse getMachine(@PathVariable Integer id) {
        return machineManagementService.getMachine(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public MachineResponse createMachine(@Valid @RequestBody MachineCreateRequest request) {
        return machineManagementService.createMachine(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MachineResponse updateMachine(
            @PathVariable Integer id,
            @Valid @RequestBody MachineUpdateRequest request
    ) {
        return machineManagementService.updateMachine(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public MachineResponse updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody MachineStatusUpdateRequest request
    ) {
        return machineManagementService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse deleteMachine(@PathVariable Integer id) {
        return machineManagementService.deleteMachine(id);
    }

    @GetMapping("/areas")
    public List<AreaResponse> getAreas() {
        return machineManagementService.getAreas();
    }

    @PostMapping("/areas")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AreaResponse createArea(@Valid @RequestBody AreaUpsertRequest request) {
        return machineManagementService.createArea(request);
    }

    @PutMapping("/areas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AreaResponse updateArea(
            @PathVariable Integer id,
            @Valid @RequestBody AreaUpsertRequest request
    ) {
        return machineManagementService.updateArea(id, request);
    }

    @DeleteMapping("/areas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse deleteArea(@PathVariable Integer id) {
        return machineManagementService.deleteArea(id);
    }

    @GetMapping("/statuses")
    public List<String> getStatuses() {
        return machineManagementService.getStatuses();
    }
}
