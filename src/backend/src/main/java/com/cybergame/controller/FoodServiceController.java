package com.cybergame.controller;

import com.cybergame.dto.request.ServiceItemCreateRequest;
import com.cybergame.dto.request.ServiceItemStatusUpdateRequest;
import com.cybergame.dto.request.ServiceItemUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.ServiceItemResponse;
import com.cybergame.entity.enums.ServiceStatus;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.FoodServiceManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/food-services")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CUSTOMER')")
public class FoodServiceController {

    private final FoodServiceManagementService foodServiceManagementService;

    @GetMapping
    public Page<ServiceItemResponse> getServiceItems(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) ServiceStatus status,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return foodServiceManagementService.getServiceItems(currentUser, keyword, serviceType, status, pageable);
    }

    @GetMapping("/{id}")
    public ServiceItemResponse getServiceItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return foodServiceManagementService.getServiceItem(currentUser, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ServiceItemResponse createServiceItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ServiceItemCreateRequest request
    ) {
        return foodServiceManagementService.createServiceItem(currentUser, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ServiceItemResponse updateServiceItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody ServiceItemUpdateRequest request
    ) {
        return foodServiceManagementService.updateServiceItem(currentUser, id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ServiceItemResponse updateServiceItemStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody ServiceItemStatusUpdateRequest request
    ) {
        return foodServiceManagementService.updateServiceItemStatus(currentUser, id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public MessageResponse deactivateServiceItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return foodServiceManagementService.deactivateServiceItem(currentUser, id);
    }

    @GetMapping("/statuses")
    public List<String> getServiceStatuses() {
        return foodServiceManagementService.getServiceStatuses();
    }
}
