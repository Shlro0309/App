package com.cybergame.service;

import com.cybergame.dto.request.PaymentCheckoutRequest;
import com.cybergame.dto.request.PaymentPayRequest;
import com.cybergame.dto.request.PaymentStatusUpdateRequest;
import com.cybergame.dto.request.CustomerTopUpRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PaymentResponse;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PaymentService {

    Page<PaymentResponse> getPayments(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            Integer playSessionId,
            Integer orderId,
            InvoiceStatus status,
            Pageable pageable
    );

    PaymentResponse getPayment(CurrentUser currentUser, Integer id);

    PaymentResponse checkout(CurrentUser currentUser, PaymentCheckoutRequest request);

    PaymentResponse topUp(CurrentUser currentUser, CustomerTopUpRequest request);

    PaymentResponse pay(CurrentUser currentUser, Integer id, PaymentPayRequest request);

    PaymentResponse updateStatus(CurrentUser currentUser, Integer id, PaymentStatusUpdateRequest request);

    MessageResponse cancelPayment(CurrentUser currentUser, Integer id);

    List<String> getStatuses();

    List<String> getPaymentMethods();
}
