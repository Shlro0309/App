package com.cybergame.repository;

import com.cybergame.entity.CustomerOrder;
import com.cybergame.entity.enums.OrderStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class CustomerOrderSpecifications {

    private CustomerOrderSpecifications() {
    }

    public static Specification<CustomerOrder> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            var customer = root.join("customer", JoinType.LEFT);
            var user = customer.join("user", JoinType.LEFT);
            var details = root.join("orderDetails", JoinType.LEFT);
            var serviceItem = details.join("serviceItem", JoinType.LEFT);

            if (query != null) {
                query.distinct(true);
            }

            return builder.or(
                    builder.like(builder.lower(user.get("fullName")), pattern),
                    builder.like(builder.lower(user.get("phoneNumber")), pattern),
                    builder.like(builder.lower(user.get("email")), pattern),
                    builder.like(builder.lower(serviceItem.get("name")), pattern),
                    builder.like(builder.lower(serviceItem.get("serviceType")), pattern)
            );
        };
    }

    public static Specification<CustomerOrder> hasCustomer(Integer customerId) {
        return (root, query, builder) -> customerId == null
                ? builder.conjunction()
                : builder.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<CustomerOrder> hasPlaySession(Integer playSessionId) {
        return (root, query, builder) -> playSessionId == null
                ? builder.conjunction()
                : builder.equal(root.get("playSession").get("id"), playSessionId);
    }

    public static Specification<CustomerOrder> hasStatus(OrderStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }
}
