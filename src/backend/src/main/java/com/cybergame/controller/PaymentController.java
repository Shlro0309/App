package com.cybergame.controller;

import com.cybergame.dto.request.CustomerTopUpRequest;
import com.cybergame.dto.request.PaymentPayRequest;
import com.cybergame.dto.request.PaymentStatusUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PaymentResponse;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CUSTOMER')")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public Page<PaymentResponse> getPayments(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) Integer playSessionId,
            @RequestParam(required = false) Integer orderId,
            @RequestParam(required = false) InvoiceStatus status,
            @PageableDefault(size = 20, sort = "transactionAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return paymentService.getPayments(currentUser, keyword, customerId, playSessionId, orderId, status, pageable);
    }

    @GetMapping("/{id}")
    public PaymentResponse getPayment(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return paymentService.getPayment(currentUser, id);
    }

    @PostMapping("/top-up")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentResponse topUp(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CustomerTopUpRequest request
    ) {
        return paymentService.topUp(currentUser, request);
    }

    @PatchMapping("/{id}/pay")
    public PaymentResponse pay(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody PaymentPayRequest request
    ) {
        return paymentService.pay(currentUser, id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public PaymentResponse updateStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody PaymentStatusUpdateRequest request
    ) {
        return paymentService.updateStatus(currentUser, id, request);
    }

    @PatchMapping("/{id}/cancel")
    public MessageResponse cancelPayment(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return paymentService.cancelPayment(currentUser, id);
    }

    @GetMapping("/statuses")
    public List<String> getStatuses() {
        return paymentService.getStatuses();
    }

    @GetMapping("/methods")
    public List<String> getPaymentMethods() {
        return paymentService.getPaymentMethods();
    }
}
