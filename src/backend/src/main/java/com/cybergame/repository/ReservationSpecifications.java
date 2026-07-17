package com.cybergame.repository;

import com.cybergame.entity.Reservation;
import com.cybergame.entity.enums.ReservationStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class ReservationSpecifications {

    private ReservationSpecifications() {
    }

    public static Specification<Reservation> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            var customer = root.join("customer", JoinType.LEFT);
            var user = customer.join("user", JoinType.LEFT);
            var machines = root.join("machines", JoinType.LEFT);

            if (query != null) {
                query.distinct(true);
            }

            return builder.or(
                    builder.like(builder.lower(user.get("fullName")), pattern),
                    builder.like(builder.lower(user.get("phoneNumber")), pattern),
                    builder.like(builder.lower(user.get("email")), pattern),
                    builder.like(builder.lower(machines.get("name")), pattern)
            );
        };
    }

    public static Specification<Reservation> hasCustomer(Integer customerId) {
        return (root, query, builder) -> customerId == null
                ? builder.conjunction()
                : builder.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<Reservation> hasStatus(ReservationStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }
}
