package com.cybergame.repository;

import com.cybergame.entity.Invoice;
import com.cybergame.entity.enums.InvoiceStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class PaymentSpecifications {

    private PaymentSpecifications() {
    }

    public static Specification<Invoice> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            var customer = root.join("customer", JoinType.LEFT);
            var user = customer.join("user", JoinType.LEFT);
            var playSession = root.join("playSession", JoinType.LEFT);
            var machine = playSession.join("machine", JoinType.LEFT);

            return builder.or(
                    builder.like(builder.lower(root.get("transactionType")), pattern),
                    builder.like(builder.lower(root.get("paymentMethod")), pattern),
                    builder.like(builder.lower(user.get("fullName")), pattern),
                    builder.like(builder.lower(user.get("phoneNumber")), pattern),
                    builder.like(builder.lower(user.get("email")), pattern),
                    builder.like(builder.lower(machine.get("name")), pattern)
            );
        };
    }

    public static Specification<Invoice> hasCustomer(Integer customerId) {
        return (root, query, builder) -> customerId == null
                ? builder.conjunction()
                : builder.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<Invoice> hasPlaySession(Integer playSessionId) {
        return (root, query, builder) -> playSessionId == null
                ? builder.conjunction()
                : builder.equal(root.get("playSession").get("id"), playSessionId);
    }

    public static Specification<Invoice> hasOrder(Integer orderId) {
        return (root, query, builder) -> orderId == null
                ? builder.conjunction()
                : builder.equal(root.get("order").get("id"), orderId);
    }

    public static Specification<Invoice> hasStatus(InvoiceStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }
}
