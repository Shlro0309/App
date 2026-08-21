package com.cybergame.service;

import com.cybergame.dto.request.CustomerOrderCreateRequest;
import com.cybergame.dto.request.CustomerOrderStatusUpdateRequest;
import com.cybergame.dto.request.ServiceItemCreateRequest;
import com.cybergame.dto.request.ServiceItemStatusUpdateRequest;
import com.cybergame.dto.request.ServiceItemUpdateRequest;
import com.cybergame.dto.response.CustomerOrderResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.ServiceItemResponse;
import com.cybergame.entity.enums.OrderStatus;
import com.cybergame.entity.enums.ServiceStatus;
import com.cybergame.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FoodServiceManagementService {

    Page<ServiceItemResponse> getServiceItems(
            CurrentUser currentUser,
            String keyword,
            String serviceType,
            ServiceStatus status,
            Pageable pageable
    );

    ServiceItemResponse getServiceItem(CurrentUser currentUser, Integer id);

    ServiceItemResponse createServiceItem(CurrentUser currentUser, ServiceItemCreateRequest request);

    ServiceItemResponse updateServiceItem(CurrentUser currentUser, Integer id, ServiceItemUpdateRequest request);

    ServiceItemResponse updateServiceItemStatus(
            CurrentUser currentUser,
            Integer id,
            ServiceItemStatusUpdateRequest request
    );

    MessageResponse deactivateServiceItem(CurrentUser currentUser, Integer id);

    Page<CustomerOrderResponse> getOrders(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            Integer playSessionId,
            OrderStatus status,
            Pageable pageable
    );

    CustomerOrderResponse getOrder(CurrentUser currentUser, Integer id);

    CustomerOrderResponse createOrder(CurrentUser currentUser, CustomerOrderCreateRequest request);

    CustomerOrderResponse updateOrderStatus(
            CurrentUser currentUser,
            Integer id,
            CustomerOrderStatusUpdateRequest request
    );

    MessageResponse cancelOrder(CurrentUser currentUser, Integer id);

    List<String> getServiceStatuses();

    List<String> getOrderStatuses();
}
