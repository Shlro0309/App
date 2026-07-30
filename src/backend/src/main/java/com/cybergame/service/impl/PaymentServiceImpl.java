package com.cybergame.service.impl;

import com.cybergame.dto.request.CustomerTopUpRequest;
import com.cybergame.dto.request.PaymentPayRequest;
import com.cybergame.dto.request.PaymentStatusUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PaymentResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.Employee;
import com.cybergame.entity.Invoice;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.entity.enums.OrderStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.PaymentMapper;
import com.cybergame.repository.CustomerOrderRepository;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.EmployeeRepository;
import com.cybergame.repository.InvoiceRepository;
import com.cybergame.repository.PaymentSpecifications;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.PaymentService;
import com.cybergame.websocket.RealtimeEventPublisher;
import com.cybergame.websocket.RealtimeEventType;
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

    private static final String FOOD_ORDER_TRANSACTION = "FOOD_ORDER";
    private static final String WALLET_TOP_UP_TRANSACTION = "WALLET_TOP_UP";
    private static final String CASH_METHOD = "CASH";
    private static final String BANK_TRANSFER_METHOD = "BANK_TRANSFER";
    private static final String ACCOUNT_BALANCE_METHOD = "ACCOUNT_BALANCE";
    private static final List<String> TOP_UP_PAYMENT_METHODS = List.of(CASH_METHOD, BANK_TRANSFER_METHOD);
    private static final List<String> PAYMENT_METHODS = List.of(CASH_METHOD, BANK_TRANSFER_METHOD, ACCOUNT_BALANCE_METHOD);

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final PaymentMapper paymentMapper;
    private final RealtimeEventPublisher realtimeEventPublisher;

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
    public PaymentResponse topUp(CurrentUser currentUser, CustomerTopUpRequest request) {
        Customer customer = getCurrentCustomer(currentUser);
        BigDecimal amount = normalizeAmount(request.amount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Số tiền nạp phải lớn hơn 0");
        }

        Invoice invoice = new Invoice();
        invoice.setCustomer(customer);
        invoice.setEmployee(null);
        invoice.setTransactionType(WALLET_TOP_UP_TRANSACTION);
        invoice.setAmount(amount);
        invoice.setPaymentMethod(resolveTopUpPaymentMethod(request.paymentMethod()));
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setTransactionAt(LocalDateTime.now());

        Invoice savedInvoice = invoiceRepository.save(invoice);
        publishPaymentChanged(savedInvoice, "TOP_UP_REQUESTED");
        return paymentMapper.toResponse(savedInvoice);
    }

    @Override
    @Transactional
    public PaymentResponse pay(CurrentUser currentUser, Integer id, PaymentPayRequest request) {
        Invoice invoice = getInvoiceById(id);
        validateCanAccess(currentUser, invoice);

        if (invoice.getStatus() != InvoiceStatus.PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "Chỉ hóa đơn chờ thanh toán mới được xác nhận thanh toán");
        }

        String paymentMethod = resolvePaymentMethodForInvoice(invoice, request.paymentMethod());
        applyPaidPaymentEffects(currentUser, invoice, paymentMethod);
        invoice.setPaymentMethod(paymentMethod);
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setTransactionAt(LocalDateTime.now());
        resolveCurrentEmployee(currentUser).ifPresent(invoice::setEmployee);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        prepareFoodOrderAfterPaid(savedInvoice);
        publishPaymentChanged(savedInvoice, InvoiceStatus.PAID.name());
        return paymentMapper.toResponse(savedInvoice);
    }

    @Override
    @Transactional
    public PaymentResponse updateStatus(CurrentUser currentUser, Integer id, PaymentStatusUpdateRequest request) {
        validateCanManagePayments(currentUser);
        Invoice invoice = getInvoiceById(id);
        InvoiceStatus currentStatus = invoice.getStatus();
        InvoiceStatus nextStatus = request.status();

        validatePaymentStatusTransition(currentStatus, nextStatus);
        if (currentStatus == nextStatus) {
            return paymentMapper.toResponse(invoice);
        }

        String paymentMethod = invoice.getPaymentMethod();
        if (nextStatus == InvoiceStatus.PAID) {
            paymentMethod = resolvePaymentMethodForInvoice(invoice, request.paymentMethod());
            applyPaidPaymentEffects(currentUser, invoice, paymentMethod);
            invoice.setPaymentMethod(paymentMethod);
        } else if (nextStatus == InvoiceStatus.REFUNDED) {
            applyRefundPaymentEffects(invoice);
        }
        invoice.setStatus(nextStatus);
        if (nextStatus == InvoiceStatus.PAID || nextStatus == InvoiceStatus.REFUNDED) {
            invoice.setTransactionAt(LocalDateTime.now());
        }
        resolveCurrentEmployee(currentUser).ifPresent(invoice::setEmployee);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        if (savedInvoice.getStatus() == InvoiceStatus.PAID) {
            prepareFoodOrderAfterPaid(savedInvoice);
        } else if (savedInvoice.getStatus() == InvoiceStatus.CANCELLED) {
            cancelFoodOrderAfterPaymentCancelled(savedInvoice);
        } else if (savedInvoice.getStatus() == InvoiceStatus.REFUNDED) {
            refundFoodOrderAfterPaymentRefunded(savedInvoice);
        }
        publishPaymentChanged(savedInvoice, savedInvoice.getStatus().name());
        return paymentMapper.toResponse(savedInvoice);
    }

    @Override
    @Transactional
    public MessageResponse cancelPayment(CurrentUser currentUser, Integer id) {
        Invoice invoice = getInvoiceById(id);
        validateCanAccess(currentUser, invoice);

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Hóa đơn đã bị hủy");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Hóa đơn đã thanh toán phải được hoàn tiền thay vì hủy");
        }
        if (invoice.getStatus() == InvoiceStatus.REFUNDED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Hóa đơn đã hoàn tiền không thể hủy");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        Invoice savedInvoice = invoiceRepository.save(invoice);
        cancelFoodOrderAfterPaymentCancelled(savedInvoice);
        publishPaymentChanged(savedInvoice, InvoiceStatus.CANCELLED.name());
        return new MessageResponse("Đã hủy hóa đơn");
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn"));
    }

    private Customer getCurrentCustomer(CurrentUser currentUser) {
        return customerRepository.findByUserId(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng"));
    }

    private Optional<Employee> resolveCurrentEmployee(CurrentUser currentUser) {
        if (!canManagePayments(currentUser)) {
            return Optional.empty();
        }
        return employeeRepository.findByUserId(currentUser.id());
    }

    private String resolvePaymentMethodForInvoice(Invoice invoice, String requestPaymentMethod) {
        if (WALLET_TOP_UP_TRANSACTION.equals(invoice.getTransactionType())) {
            String topUpMethod = toNullableText(requestPaymentMethod);
            if (topUpMethod == null) {
                topUpMethod = invoice.getPaymentMethod();
            }
            return resolveTopUpPaymentMethod(topUpMethod);
        }
        return resolveServicePaymentMethod(invoice.getPaymentMethod(), requestPaymentMethod);
    }

    private String resolveServicePaymentMethod(String currentPaymentMethod, String requestPaymentMethod) {
        String nextPaymentMethod = toNullableText(requestPaymentMethod);
        if (nextPaymentMethod != null) {
            validatePaymentMethod(nextPaymentMethod, PAYMENT_METHODS, "Phương thức thanh toán không được hỗ trợ cho đơn dịch vụ");
            return nextPaymentMethod;
        }
        if (currentPaymentMethod != null && !currentPaymentMethod.isBlank()) {
            validatePaymentMethod(currentPaymentMethod, PAYMENT_METHODS, "Phương thức thanh toán không được hỗ trợ cho đơn dịch vụ");
            return currentPaymentMethod;
        }
        return PAYMENT_METHODS.get(0);
    }

    private String resolveTopUpPaymentMethod(String requestPaymentMethod) {
        String paymentMethod = toNullableText(requestPaymentMethod);
        if (paymentMethod == null) {
            paymentMethod = TOP_UP_PAYMENT_METHODS.get(0);
        }
        validatePaymentMethod(paymentMethod, TOP_UP_PAYMENT_METHODS, "Nạp tiền chỉ hỗ trợ tiền mặt hoặc chuyển khoản");
        return paymentMethod;
    }

    private void validatePaymentMethod(String paymentMethod, List<String> supportedMethods, String message) {
        if (!supportedMethods.contains(paymentMethod)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void validatePaymentStatusTransition(InvoiceStatus currentStatus, InvoiceStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return;
        }
        if (currentStatus == InvoiceStatus.PENDING
                && (nextStatus == InvoiceStatus.PAID || nextStatus == InvoiceStatus.CANCELLED)) {
            return;
        }
        if (currentStatus == InvoiceStatus.PAID && nextStatus == InvoiceStatus.REFUNDED) {
            return;
        }
        if (currentStatus == InvoiceStatus.CANCELLED || currentStatus == InvoiceStatus.REFUNDED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Hóa đơn đã đóng không thể thay đổi");
        }
        throw new BusinessException(HttpStatus.CONFLICT, "Không thể chuyển hóa đơn sang trạng thái này");
    }

    private void applyPaidPaymentEffects(CurrentUser currentUser, Invoice invoice, String paymentMethod) {
        if (WALLET_TOP_UP_TRANSACTION.equals(invoice.getTransactionType())) {
            validateCanManagePayments(currentUser);
            creditCustomerBalance(invoice.getCustomer(), invoice.getAmount());
            return;
        }

        if (ACCOUNT_BALANCE_METHOD.equals(paymentMethod)) {
            debitCustomerBalance(invoice.getCustomer(), invoice.getAmount());
            return;
        }

        if (!canManagePayments(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Chỉ admin hoặc nhân viên được xác nhận thanh toán bên ngoài");
        }
    }

    private void applyRefundPaymentEffects(Invoice invoice) {
        if (WALLET_TOP_UP_TRANSACTION.equals(invoice.getTransactionType())) {
            debitCustomerBalance(invoice.getCustomer(), invoice.getAmount());
            return;
        }

        if (ACCOUNT_BALANCE_METHOD.equals(invoice.getPaymentMethod())) {
            creditCustomerBalance(invoice.getCustomer(), invoice.getAmount());
        }
    }

    private void creditCustomerBalance(Customer customer, BigDecimal amount) {
        customer.setBalance(normalizeAmount(customer.getBalance()).add(normalizeAmount(amount)));
        customerRepository.save(customer);
    }

    private void debitCustomerBalance(Customer customer, BigDecimal amount) {
        BigDecimal currentBalance = normalizeAmount(customer.getBalance());
        BigDecimal normalizedAmount = normalizeAmount(amount);
        if (currentBalance.compareTo(normalizedAmount) < 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Số dư khách hàng không đủ để thanh toán hóa đơn này");
        }
        customer.setBalance(currentBalance.subtract(normalizedAmount));
        customerRepository.save(customer);
    }

    private void validateCanAccess(CurrentUser currentUser, Invoice invoice) {
        if (canManagePayments(currentUser)) {
            return;
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!invoice.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Hóa đơn không thuộc khách hàng hiện tại");
        }
    }

    private void validateCanManagePayments(CurrentUser currentUser) {
        if (!canManagePayments(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Chỉ admin hoặc nhân viên được quản lý trạng thái thanh toán");
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

    private void prepareFoodOrderAfterPaid(Invoice invoice) {
        CustomerOrder order = invoice.getOrder();
        if (order == null || !FOOD_ORDER_TRANSACTION.equals(invoice.getTransactionType())) {
            return;
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            return;
        }

        order.setStatus(OrderStatus.PREPARING);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        publishFoodOrderChanged(savedOrder.getId(), OrderStatus.PREPARING.name());
    }

    private void cancelFoodOrderAfterPaymentCancelled(Invoice invoice) {
        CustomerOrder order = invoice.getOrder();
        if (order == null || !FOOD_ORDER_TRANSACTION.equals(invoice.getTransactionType())) {
            return;
        }
        cancelFoodOrderFromPayment(order, false);
    }

    private void refundFoodOrderAfterPaymentRefunded(Invoice invoice) {
        CustomerOrder order = invoice.getOrder();
        if (order == null || !FOOD_ORDER_TRANSACTION.equals(invoice.getTransactionType())) {
            return;
        }
        cancelFoodOrderFromPayment(order, true);
    }

    private void cancelFoodOrderFromPayment(CustomerOrder order, boolean refunded) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            order.getOrderDetails().forEach(detail -> {
                var serviceItem = detail.getServiceItem();
                serviceItem.setStockQuantity(serviceItem.getStockQuantity() + detail.getQuantity());
            });
        }
        order.setStatus(OrderStatus.CANCELLED);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        publishFoodOrderChanged(savedOrder.getId(), refunded ? InvoiceStatus.REFUNDED.name() : OrderStatus.CANCELLED.name());
    }

    private void publishPaymentChanged(Invoice invoice, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.PAYMENT_CHANGED,
                invoice.getId(),
                action,
                "Dữ liệu thanh toán đã thay đổi"
        );
    }

    private void publishFoodOrderChanged(Integer entityId, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.FOOD_ORDER_CHANGED,
                entityId,
                action,
                "Dữ liệu dịch vụ đã thay đổi"
        );
    }
}
