package com.cybergame.controller;

import com.cybergame.dto.request.CustomerOrderCreateRequest;
import com.cybergame.dto.request.CustomerOrderStatusUpdateRequest;
import com.cybergame.dto.response.CustomerOrderResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.entity.enums.OrderStatus;
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
@RequestMapping("/food-orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CUSTOMER')")
public class FoodOrderController {

    private final FoodServiceManagementService foodServiceManagementService;

    @GetMapping
    public Page<CustomerOrderResponse> getOrders(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) Integer playSessionId,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20, sort = "orderedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return foodServiceManagementService.getOrders(
                currentUser,
                keyword,
                customerId,
                playSessionId,
                status,
                pageable
        );
    }

    @GetMapping("/{id}")
    public CustomerOrderResponse getOrder(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return foodServiceManagementService.getOrder(currentUser, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerOrderResponse createOrder(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CustomerOrderCreateRequest request
    ) {
        return foodServiceManagementService.createOrder(currentUser, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public CustomerOrderResponse updateOrderStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody CustomerOrderStatusUpdateRequest request
    ) {
        return foodServiceManagementService.updateOrderStatus(currentUser, id, request);
    }

    @GetMapping("/statuses")
    public List<String> getOrderStatuses() {
        return foodServiceManagementService.getOrderStatuses();
    }

    @PatchMapping("/{id}/cancel")
    public MessageResponse cancelOrder(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return foodServiceManagementService.cancelOrder(currentUser, id);
    }
}
