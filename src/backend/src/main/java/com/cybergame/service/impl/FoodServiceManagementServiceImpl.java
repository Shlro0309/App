package com.cybergame.service.impl;

import com.cybergame.dto.request.CustomerOrderCreateRequest;
import com.cybergame.dto.request.CustomerOrderStatusUpdateRequest;
import com.cybergame.dto.request.OrderItemRequest;
import com.cybergame.dto.request.ServiceItemCreateRequest;
import com.cybergame.dto.request.ServiceItemStatusUpdateRequest;
import com.cybergame.dto.request.ServiceItemUpdateRequest;
import com.cybergame.dto.response.CustomerOrderResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.ServiceItemResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.Employee;
import com.cybergame.entity.Invoice;
import com.cybergame.entity.OrderDetail;
import com.cybergame.entity.PlaySession;
import com.cybergame.entity.ServiceItem;
import com.cybergame.entity.enums.InvoiceStatus;
import com.cybergame.entity.enums.OrderStatus;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.entity.enums.ServiceStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.CustomerOrderMapper;
import com.cybergame.mapper.ServiceItemMapper;
import com.cybergame.repository.CustomerOrderRepository;
import com.cybergame.repository.CustomerOrderSpecifications;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.EmployeeRepository;
import com.cybergame.repository.InvoiceRepository;
import com.cybergame.repository.OrderDetailRepository;
import com.cybergame.repository.PlaySessionRepository;
import com.cybergame.repository.ServiceItemRepository;
import com.cybergame.repository.ServiceItemSpecifications;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.FoodServiceManagementService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FoodServiceManagementServiceImpl implements FoodServiceManagementService {

    private static final String FOOD_ORDER_TRANSACTION = "FOOD_ORDER";
    private static final String CASH_METHOD = "CASH";
    private static final String BANK_TRANSFER_METHOD = "BANK_TRANSFER";
    private static final String ACCOUNT_BALANCE_METHOD = "ACCOUNT_BALANCE";
    private static final List<String> PAYMENT_METHODS = List.of(CASH_METHOD, BANK_TRANSFER_METHOD, ACCOUNT_BALANCE_METHOD);

    private final ServiceItemRepository serviceItemRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PlaySessionRepository playSessionRepository;
    private final ServiceItemMapper serviceItemMapper;
    private final CustomerOrderMapper customerOrderMapper;
    private final RealtimeEventPublisher realtimeEventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceItemResponse> getServiceItems(
            CurrentUser currentUser,
            String keyword,
            String serviceType,
            ServiceStatus status,
            Pageable pageable
    ) {
        ServiceStatus effectiveStatus = canManageFoodService(currentUser) ? status : ServiceStatus.ACTIVE;
        Specification<ServiceItem> specification = Specification
                .where(ServiceItemSpecifications.hasKeyword(keyword))
                .and(ServiceItemSpecifications.hasServiceType(serviceType))
                .and(ServiceItemSpecifications.hasStatus(effectiveStatus));

        return serviceItemRepository.findAll(specification, pageable)
                .map(serviceItemMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceItemResponse getServiceItem(CurrentUser currentUser, Integer id) {
        ServiceItem serviceItem = getServiceItemById(id);
        if (!canManageFoodService(currentUser) && serviceItem.getStatus() != ServiceStatus.ACTIVE) {
            throw new ResourceNotFoundException("Không tìm thấy dịch vụ");
        }
        return serviceItemMapper.toResponse(serviceItem);
    }

    @Override
    @Transactional
    public ServiceItemResponse createServiceItem(CurrentUser currentUser, ServiceItemCreateRequest request) {
        validateCanManageFoodService(currentUser);
        if (serviceItemRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Tên dịch vụ đã tồn tại");
        }

        ServiceItem serviceItem = new ServiceItem();
        serviceItem.setName(request.name().trim());
        serviceItem.setPrice(request.price() == null ? BigDecimal.ZERO : request.price());
        serviceItem.setServiceType(toNullableText(request.serviceType()));
        serviceItem.setImageUrl(toNullableText(request.imageUrl()));
        serviceItem.setStockQuantity(request.stockQuantity() == null ? 0 : request.stockQuantity());
        serviceItem.setStatus(request.status() == null ? ServiceStatus.ACTIVE : request.status());

        ServiceItem savedServiceItem = serviceItemRepository.save(serviceItem);
        publishFoodOrderChanged(savedServiceItem.getId(), "SERVICE_ITEM_CREATED");
        return serviceItemMapper.toResponse(savedServiceItem);
    }

    @Override
    @Transactional
    public ServiceItemResponse updateServiceItem(CurrentUser currentUser, Integer id, ServiceItemUpdateRequest request) {
        validateCanManageFoodService(currentUser);
        ServiceItem serviceItem = getServiceItemById(id);
        if (serviceItemRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Tên dịch vụ đã tồn tại");
        }

        serviceItem.setName(request.name().trim());
        serviceItem.setPrice(request.price() == null ? BigDecimal.ZERO : request.price());
        serviceItem.setServiceType(toNullableText(request.serviceType()));
        serviceItem.setImageUrl(toNullableText(request.imageUrl()));
        serviceItem.setStockQuantity(request.stockQuantity() == null ? 0 : request.stockQuantity());

        ServiceItem savedServiceItem = serviceItemRepository.save(serviceItem);
        publishFoodOrderChanged(savedServiceItem.getId(), "SERVICE_ITEM_UPDATED");
        return serviceItemMapper.toResponse(savedServiceItem);
    }

    @Override
    @Transactional
    public ServiceItemResponse updateServiceItemStatus(
            CurrentUser currentUser,
            Integer id,
            ServiceItemStatusUpdateRequest request
    ) {
        validateCanManageFoodService(currentUser);
        ServiceItem serviceItem = getServiceItemById(id);
        serviceItem.setStatus(request.status());
        ServiceItem savedServiceItem = serviceItemRepository.save(serviceItem);
        publishFoodOrderChanged(savedServiceItem.getId(), "SERVICE_ITEM_" + savedServiceItem.getStatus().name());
        return serviceItemMapper.toResponse(savedServiceItem);
    }

    @Override
    @Transactional
    public MessageResponse deactivateServiceItem(CurrentUser currentUser, Integer id) {
        validateCanManageFoodService(currentUser);
        ServiceItem serviceItem = getServiceItemById(id);
        serviceItem.setStatus(ServiceStatus.INACTIVE);
        serviceItemRepository.save(serviceItem);
        publishFoodOrderChanged(serviceItem.getId(), "SERVICE_ITEM_INACTIVE");
        return new MessageResponse("Đã ngừng kích hoạt dịch vụ");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerOrderResponse> getOrders(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            Integer playSessionId,
            OrderStatus status,
            Pageable pageable
    ) {
        Integer effectiveCustomerId = canManageFoodService(currentUser)
                ? customerId
                : getCurrentCustomer(currentUser).getId();

        Specification<CustomerOrder> specification = Specification
                .where(CustomerOrderSpecifications.hasKeyword(keyword))
                .and(CustomerOrderSpecifications.hasCustomer(effectiveCustomerId))
                .and(CustomerOrderSpecifications.hasPlaySession(playSessionId))
                .and(CustomerOrderSpecifications.hasStatus(status));

        return customerOrderRepository.findAll(specification, pageable)
                .map(customerOrderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerOrderResponse getOrder(CurrentUser currentUser, Integer id) {
        CustomerOrder order = getOrderById(id);
        validateCanAccessOrder(currentUser, order);
        return customerOrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public CustomerOrderResponse createOrder(CurrentUser currentUser, CustomerOrderCreateRequest request) {
        Customer customer = resolveCustomer(currentUser, request.customerId());
        PlaySession playSession = resolvePlaySession(request.playSessionId(), customer);
        Map<Integer, Integer> quantitiesByService = normalizeItems(request.items());

        CustomerOrder order = new CustomerOrder();
        order.setCustomer(customer);
        order.setPlaySession(playSession);
        order.setEmployee(resolveCurrentEmployee(currentUser).orElse(null));
        order.setOrderedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

        CustomerOrder savedOrder = customerOrderRepository.save(order);
        List<OrderDetail> details = createOrderDetails(savedOrder, quantitiesByService);
        BigDecimal totalAmount = details.stream()
                .map(detail -> detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String paymentMethod = resolvePaymentMethod(currentUser, request.paymentMethod());
        if (ACCOUNT_BALANCE_METHOD.equals(paymentMethod)) {
            debitCustomerBalance(customer, totalAmount);
            savedOrder.setStatus(OrderStatus.PREPARING);
        }

        savedOrder.setTotalAmount(totalAmount);
        orderDetailRepository.saveAll(details);
        customerOrderRepository.save(savedOrder);
        Invoice savedInvoice = createOrderInvoice(savedOrder, paymentMethod);
        publishFoodOrderChanged(savedOrder.getId(), "ORDER_CREATED");
        publishPaymentChanged(savedInvoice.getId(), "FOOD_ORDER_PAYMENT_CREATED");

        return customerOrderMapper.toResponse(getOrderById(savedOrder.getId()));
    }

    @Override
    @Transactional
    public CustomerOrderResponse updateOrderStatus(
            CurrentUser currentUser,
            Integer id,
            CustomerOrderStatusUpdateRequest request
    ) {
        validateCanManageFoodService(currentUser);
        CustomerOrder order = getOrderById(id);
        OrderStatus currentStatus = order.getStatus();
        OrderStatus nextStatus = request.status();

        validateOrderStatusTransition(currentStatus, nextStatus);
        if (currentStatus == nextStatus) {
            return customerOrderMapper.toResponse(order);
        }

        if (nextStatus == OrderStatus.CANCELLED) {
            CustomerOrder savedOrder = cancelOrderAndClosePayment(order);
            publishFoodOrderChanged(savedOrder.getId(), savedOrder.getStatus().name());
            return customerOrderMapper.toResponse(savedOrder);
        }

        order.setStatus(nextStatus);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        publishFoodOrderChanged(savedOrder.getId(), savedOrder.getStatus().name());
        return customerOrderMapper.toResponse(savedOrder);
    }

    @Override
    @Transactional
    public MessageResponse cancelOrder(CurrentUser currentUser, Integer id) {
        CustomerOrder order = getOrderById(id);
        validateCanAccessOrder(currentUser, order);

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Đơn gọi món đã bị hủy");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Không thể hủy đơn gọi món đã hoàn tất");
        }

        CustomerOrder savedOrder = cancelOrderAndClosePayment(order);
        publishFoodOrderChanged(savedOrder.getId(), OrderStatus.CANCELLED.name());
        return new MessageResponse("Đã hủy đơn gọi món");
    }

    @Override
    public List<String> getServiceStatuses() {
        return Arrays.stream(ServiceStatus.values())
                .map(Enum::name)
                .toList();
    }

    @Override
    public List<String> getOrderStatuses() {
        return Arrays.stream(OrderStatus.values())
                .map(Enum::name)
                .toList();
    }

    private ServiceItem getServiceItemById(Integer id) {
        return serviceItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ"));
    }

    private CustomerOrder getOrderById(Integer id) {
        return customerOrderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn gọi món"));
    }

    private Customer resolveCustomer(CurrentUser currentUser, Integer requestCustomerId) {
        if (canManageFoodService(currentUser)) {
            if (requestCustomerId == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Thiếu mã khách hàng");
            }
            return customerRepository.findById(requestCustomerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (requestCustomerId != null && !currentCustomer.getId().equals(requestCustomerId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Khách hàng chỉ được tạo đơn gọi món cho tài khoản của mình");
        }
        return currentCustomer;
    }

    private Customer getCurrentCustomer(CurrentUser currentUser) {
        return customerRepository.findByUserId(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng"));
    }

    private Optional<Employee> resolveCurrentEmployee(CurrentUser currentUser) {
        if (!canManageFoodService(currentUser)) {
            return Optional.empty();
        }
        return employeeRepository.findByUserId(currentUser.id());
    }

    private PlaySession resolvePlaySession(Integer playSessionId, Customer customer) {
        if (playSessionId == null) {
            return null;
        }

        PlaySession playSession = playSessionRepository.findDetailedById(playSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi"));
        if (!playSession.getCustomer().getId().equals(customer.getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Phiên chơi không thuộc khách hàng đã chọn");
        }
        if (playSession.getStatus() != PlaySessionStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Đơn gọi món chỉ được gắn với phiên chơi đang hoạt động");
        }
        return playSession;
    }

    private Map<Integer, Integer> normalizeItems(List<OrderItemRequest> items) {
        Map<Integer, Integer> quantitiesByService = new LinkedHashMap<>();
        items.forEach(item -> quantitiesByService.merge(item.serviceId(), item.quantity(), Integer::sum));
        return quantitiesByService;
    }

    private List<OrderDetail> createOrderDetails(CustomerOrder order, Map<Integer, Integer> quantitiesByService) {
        List<ServiceItem> serviceItems = serviceItemRepository.findAllByIdForUpdate(quantitiesByService.keySet());
        if (serviceItems.size() != quantitiesByService.size()) {
            throw new ResourceNotFoundException("Không tìm thấy một hoặc nhiều dịch vụ");
        }

        return serviceItems.stream()
                .map(serviceItem -> {
                    Integer quantity = quantitiesByService.get(serviceItem.getId());
                    validateOrderableServiceItem(serviceItem, quantity);
                    serviceItem.setStockQuantity(serviceItem.getStockQuantity() - quantity);

                    OrderDetail detail = new OrderDetail();
                    detail.setOrder(order);
                    detail.setServiceItem(serviceItem);
                    detail.setQuantity(quantity);
                    detail.setUnitPrice(serviceItem.getPrice());
                    order.getOrderDetails().add(detail);
                    return detail;
                })
                .toList();
    }

    private void validateOrderableServiceItem(ServiceItem serviceItem, Integer quantity) {
        if (serviceItem.getStatus() != ServiceStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Một hoặc nhiều dịch vụ đang ngừng bán");
        }
        if (serviceItem.getStockQuantity() < quantity) {
            throw new BusinessException(HttpStatus.CONFLICT, "Một hoặc nhiều dịch vụ không đủ số lượng tồn");
        }
    }

    private void restockOrder(CustomerOrder order) {
        order.getOrderDetails().forEach(detail -> {
            ServiceItem serviceItem = detail.getServiceItem();
            serviceItem.setStockQuantity(serviceItem.getStockQuantity() + detail.getQuantity());
        });
        serviceItemRepository.saveAll(
                order.getOrderDetails()
                        .stream()
                        .map(OrderDetail::getServiceItem)
                .toList()
        );
    }

    private CustomerOrder cancelOrderAndClosePayment(CustomerOrder order) {
        restockOrder(order);
        order.setStatus(OrderStatus.CANCELLED);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        closeOrderInvoiceAfterCancellation(savedOrder);
        return savedOrder;
    }

    private Invoice createOrderInvoice(CustomerOrder order, String paymentMethod) {
        if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Số tiền hóa đơn phải lớn hơn 0");
        }
        if (invoiceRepository.existsActiveOrderInvoice(order.getId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Đơn gọi món đã có hóa đơn");
        }

        Invoice invoice = new Invoice();
        invoice.setCustomer(order.getCustomer());
        invoice.setEmployee(order.getEmployee());
        invoice.setPlaySession(null);
        invoice.setOrder(order);
        invoice.setTransactionType(FOOD_ORDER_TRANSACTION);
        invoice.setAmount(order.getTotalAmount());
        invoice.setPaymentMethod(paymentMethod);
        invoice.setStatus(ACCOUNT_BALANCE_METHOD.equals(paymentMethod) ? InvoiceStatus.PAID : InvoiceStatus.PENDING);
        invoice.setTransactionAt(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    private String resolvePaymentMethod(CurrentUser currentUser, String paymentMethod) {
        String normalizedPaymentMethod = toNullableText(paymentMethod);
        if (normalizedPaymentMethod == null) {
            if (!canManageFoodService(currentUser)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Khách hàng cần chọn phương thức thanh toán cho đơn gọi món");
            }
            return CASH_METHOD;
        }
        normalizedPaymentMethod = normalizedPaymentMethod.toUpperCase(Locale.ROOT);
        if (!PAYMENT_METHODS.contains(normalizedPaymentMethod)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Phương thức thanh toán không được hỗ trợ cho đơn dịch vụ");
        }
        return normalizedPaymentMethod;
    }

    private void debitCustomerBalance(Customer customer, BigDecimal amount) {
        BigDecimal currentBalance = normalizeAmount(customer.getBalance());
        BigDecimal normalizedAmount = normalizeAmount(amount);
        if (currentBalance.compareTo(normalizedAmount) < 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Số dư khách hàng không đủ để thanh toán đơn gọi món này");
        }
        customer.setBalance(currentBalance.subtract(normalizedAmount));
        customerRepository.save(customer);
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private void creditCustomerBalance(Customer customer, BigDecimal amount) {
        customer.setBalance(normalizeAmount(customer.getBalance()).add(normalizeAmount(amount)));
        customerRepository.save(customer);
    }

    private void closeOrderInvoiceAfterCancellation(CustomerOrder order) {
        Invoice invoice = order.getInvoice();
        if (invoice == null
                || invoice.getStatus() == InvoiceStatus.CANCELLED
                || invoice.getStatus() == InvoiceStatus.REFUNDED) {
            return;
        }

        if (invoice.getStatus() == InvoiceStatus.PENDING) {
            invoice.setStatus(InvoiceStatus.CANCELLED);
        } else if (invoice.getStatus() == InvoiceStatus.PAID) {
            if (ACCOUNT_BALANCE_METHOD.equals(invoice.getPaymentMethod())) {
                creditCustomerBalance(invoice.getCustomer(), invoice.getAmount());
            }
            invoice.setStatus(InvoiceStatus.REFUNDED);
        }
        invoice.setTransactionAt(LocalDateTime.now());
        Invoice savedInvoice = invoiceRepository.save(invoice);
        publishPaymentChanged(savedInvoice.getId(), savedInvoice.getStatus().name());
    }

    private void validateOrderStatusTransition(OrderStatus currentStatus, OrderStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return;
        }
        if (currentStatus == OrderStatus.PENDING && nextStatus == OrderStatus.CANCELLED) {
            return;
        }
        if (currentStatus == OrderStatus.PREPARING
                && (nextStatus == OrderStatus.COMPLETED || nextStatus == OrderStatus.CANCELLED)) {
            return;
        }
        if (currentStatus == OrderStatus.CANCELLED || currentStatus == OrderStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Đơn gọi món đã đóng không thể thay đổi");
        }
        throw new BusinessException(HttpStatus.CONFLICT, "Không thể chuyển đơn gọi món sang trạng thái này");
    }

    private void validateCanAccessOrder(CurrentUser currentUser, CustomerOrder order) {
        if (canManageFoodService(currentUser)) {
            return;
        }

        Customer currentCustomer = getCurrentCustomer(currentUser);
        if (!order.getCustomer().getId().equals(currentCustomer.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Đơn gọi món không thuộc khách hàng hiện tại");
        }
    }

    private void validateCanManageFoodService(CurrentUser currentUser) {
        if (!canManageFoodService(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Chỉ admin hoặc nhân viên được quản lý dịch vụ");
        }
    }

    private boolean canManageFoodService(CurrentUser currentUser) {
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

    private void publishFoodOrderChanged(Integer entityId, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.FOOD_ORDER_CHANGED,
                entityId,
                action,
                "Dữ liệu dịch vụ đã thay đổi"
        );
    }

    private void publishPaymentChanged(Integer entityId, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.PAYMENT_CHANGED,
                entityId,
                action,
                "Dữ liệu thanh toán đã thay đổi"
        );
    }
}
