package com.cybergame.service.impl;

import com.cybergame.dto.request.CustomerTopUpRequest;
import com.cybergame.dto.request.PaymentCheckoutRequest;
import com.cybergame.dto.request.PaymentPayRequest;
import com.cybergame.dto.request.PaymentStatusUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PaymentResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.Employee;
import com.cybergame.entity.Invoice;
import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.entity.enums.OrderStatus;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.PaymentMapper;
import com.cybergame.repository.CustomerOrderRepository;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.EmployeeRepository;
import com.cybergame.repository.InvoiceRepository;
import com.cybergame.repository.PaymentSpecifications;
import com.cybergame.repository.PlaySessionRepository;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.PaymentService;
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
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final String PLAY_SESSION_TRANSACTION = "PLAY_SESSION";
    private static final String FOOD_ORDER_TRANSACTION = "FOOD_ORDER";
    private static final String COMBINED_TRANSACTION = "COMBINED";
    private static final String WALLET_TOP_UP_TRANSACTION = "WALLET_TOP_UP";
    private static final List<String> PAYMENT_METHODS = List.of("CASH", "CARD", "BANK_TRANSFER", "E_WALLET");

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PlaySessionRepository playSessionRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPayments(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            Integer playSessionId,
            Integer orderId,
            InvoiceStatus status,
            Pageable pageable
    ) {
        Integer effectiveCustomerId = canManagePayments(currentUser)
                ? customerId
                : getCurrentCustomer(currentUser).getId();

        Specification<Invoice> specification = Specification
                .where(PaymentSpecifications.hasKeyword(keyword))
                .and(PaymentSpecifications.hasCustomer(effectiveCustomerId))
                .and(PaymentSpecifications.hasPlaySession(playSessionId))
                .and(PaymentSpecifications.hasOrder(orderId))
                .and(PaymentSpecifications.hasStatus(status));

        return invoiceRepository.findAll(specification, pageable)
                .map(paymentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(CurrentUser currentUser, Integer id) {
        Invoice invoice = getInvoiceById(id);
        validateCanAccess(currentUser, invoice);
        return paymentMapper.toResponse(invoice);
    }

    @Override
    @Transactional
    public PaymentResponse checkout(CurrentUser currentUser, PaymentCheckoutRequest request) {
        if (request.playSessionId() == null && request.orderId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Play session id or order id is required");
        }

        PlaySession playSession = resolvePlaySession(request.playSessionId());
        CustomerOrder order = resolveOrder(request.orderId());
        Customer customer = resolveCheckoutCustomer(currentUser, request.customerId(), playSession, order);

        if (playSession != null && invoiceRepository.existsActivePlaySessionInvoice(playSession.getId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Play session already has active invoice");
        }
        if (order != null && invoiceRepository.existsActiveOrderInvoice(order.getId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Order already has invoice");
        }

        BigDecimal playSessionAmount = playSession == null || playSession.getTotalHourlyAmount() == null
                ? BigDecimal.ZERO
                : playSession.getTotalHourlyAmount();
        BigDecimal orderAmount = order == null ? BigDecimal.ZERO : order.getTotalAmount();
        BigDecimal amount = playSessionAmount.add(orderAmount);

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Invoice amount must be greater than 0");
        }

        Invoice invoice = new Invoice();
        invoice.setCustomer(customer);
        invoice.setEmployee(resolveCurrentEmployee(currentUser).orElse(null));
        invoice.setPlaySession(playSession);
        invoice.setOrder(order);
        invoice.setTransactionType(resolveTransactionType(playSession, order));
        invoice.setAmount(amount);
        invoice.setPaymentMethod(toNullableText(request.paymentMethod()));
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setTransactionAt(LocalDateTime.now());

        return paymentMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public PaymentResponse topUp(CurrentUser currentUser, CustomerTopUpRequest request) {
        Customer customer = getCurrentCustomer(currentUser);
        BigDecimal amount = normalizeAmount(request.amount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Top-up amount must be greater than 0");
        }

        customer.setBalance(normalizeAmount(customer.getBalance()).add(amount));
        customerRepository.save(customer);

        Invoice invoice = new Invoice();
        invoice.setCustomer(customer);
        invoice.setEmployee(null);
        invoice.setTransactionType(WALLET_TOP_UP_TRANSACTION);
        invoice.setAmount(amount);
        invoice.setPaymentMethod(resolvePaymentMethod(null, request.paymentMethod()));
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setTransactionAt(LocalDateTime.now());

        return paymentMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public PaymentResponse pay(CurrentUser currentUser, Integer id, PaymentPayRequest request) {
        Invoice invoice = getInvoiceById(id);
        validateCanAccess(currentUser, invoice);

        if (invoice.getStatus() != InvoiceStatus.PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "Only pending invoice can be paid");
        }

        invoice.setPaymentMethod(resolvePaymentMethod(invoice.getPaymentMethod(), request.paymentMethod()));
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setTransactionAt(LocalDateTime.now());

        return paymentMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public PaymentResponse updateStatus(CurrentUser currentUser, Integer id, PaymentStatusUpdateRequest request) {
        validateCanManagePayments(currentUser);
        Invoice invoice = getInvoiceById(id);
        InvoiceStatus currentStatus = invoice.getStatus();
        InvoiceStatus nextStatus = request.status();

        if (currentStatus == InvoiceStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cancelled invoice cannot be changed");
        }
        if (currentStatus == InvoiceStatus.REFUNDED && nextStatus != InvoiceStatus.REFUNDED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Refunded invoice cannot be reopened");
        }
        if (nextStatus == InvoiceStatus.REFUNDED && currentStatus != InvoiceStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Only paid invoice can be refunded");
        }
        if (nextStatus == InvoiceStatus.CANCELLED && currentStatus == InvoiceStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Paid invoice must be refunded instead of cancelled");
        }

        invoice.setStatus(nextStatus);
        if (request.paymentMethod() != null && !request.paymentMethod().isBlank()) {
            invoice.setPaymentMethod(request.paymentMethod().trim());
        }
        if (nextStatus == InvoiceStatus.PAID || nextStatus == InvoiceStatus.REFUNDED) {
            invoice.setTransactionAt(LocalDateTime.now());
        }

        return paymentMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public MessageResponse cancelPayment(CurrentUser currentUser, Integer id) {
        Invoice invoice = getInvoiceById(id);
        validateCanAccess(currentUser, invoice);

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Invoice is already cancelled");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Paid invoice must be refunded instead of cancelled");
        }
        if (invoice.getStatus() == InvoiceStatus.REFUNDED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Refunded invoice cannot be cancelled");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoiceRepository.save(invoice);
        return new MessageResponse("Invoice has been cancelled");
    }

    @Override
    public List<String> getStatuses() {
        return Arrays.stream(InvoiceStatus.values())
                .map(Enum::name)
                .toList();
    }

    @Override
    public List<String> getPaymentMethods() {
        return PAYMENT_METHODS;
    }

    private Invoice getInvoiceById(Integer id) {
        return invoiceRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    private PlaySession resolvePlaySession(Integer playSessionId) {
        if (playSessionId == null) {
            return null;
        }

        PlaySession playSession = playSessionRepository.findDetailedById(playSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Play session not found"));
        if (playSession.getStatus() != PlaySessionStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Play session must be completed before checkout");
        }
        return playSession;
    }

    private CustomerOrder resolveOrder(Integer orderId) {
        if (orderId == null) {
            return null;
        }

        CustomerOrder order = customerOrderRepository.findDetailedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Order must be completed before checkout");
        }
        return order;
    }

    private Customer resolveCheckoutCustomer(
            CurrentUser currentUser,
            Integer requestCustomerId,
            PlaySession playSession,
            CustomerOrder order
    ) {
        Customer sourceCustomer = playSession != null ? playSession.getCustomer() : order.getCustomer();
        if (order != null && !order.getCustomer().getId().equals(sourceCustomer.getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Order and play session must belong to same customer");
        }
        if (requestCustomerId != null && !sourceCustomer.getId().equals(requestCustomerId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Customer id does not match checkout source");
        }

        if (canManagePayments(currentUser)) {
            return customerRepository.findById(sourceCustomer.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!sourceCustomer.getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Checkout source does not belong to current customer");
        }
        return currentCustomer;
    }

    private Customer getCurrentCustomer(CurrentUser currentUser) {
        return customerRepository.findByUserId(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found"));
    }

    private Optional<Employee> resolveCurrentEmployee(CurrentUser currentUser) {
        if (!canManagePayments(currentUser)) {
            return Optional.empty();
        }
        return employeeRepository.findByUserId(currentUser.id());
    }

    private String resolveTransactionType(PlaySession playSession, CustomerOrder order) {
        if (playSession != null && order != null) {
            return COMBINED_TRANSACTION;
        }
        if (playSession != null) {
            return PLAY_SESSION_TRANSACTION;
        }
        return FOOD_ORDER_TRANSACTION;
    }

    private String resolvePaymentMethod(String currentPaymentMethod, String requestPaymentMethod) {
        String nextPaymentMethod = toNullableText(requestPaymentMethod);
        if (nextPaymentMethod != null) {
            return nextPaymentMethod;
        }
        if (currentPaymentMethod != null && !currentPaymentMethod.isBlank()) {
            return currentPaymentMethod;
        }
        return PAYMENT_METHODS.get(0);
    }

    private void validateCanAccess(CurrentUser currentUser, Invoice invoice) {
        if (canManagePayments(currentUser)) {
            return;
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!invoice.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Invoice does not belong to current customer");
        }
    }

    private void validateCanManagePayments(CurrentUser currentUser) {
        if (!canManagePayments(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only admin or employee can manage payment status");
        }
    }

    private boolean canManagePayments(CurrentUser currentUser) {
        return currentUser.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority) || "ROLE_EMPLOYEE".equals(authority));
    }

    private String toNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
