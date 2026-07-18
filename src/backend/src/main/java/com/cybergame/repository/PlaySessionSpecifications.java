package com.cybergame.repository;

import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.PlaySessionStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class PlaySessionSpecifications {

    private PlaySessionSpecifications() {
    }

    public static Specification<PlaySession> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            var customer = root.join("customer", JoinType.LEFT);
            var user = customer.join("user", JoinType.LEFT);
            var machine = root.join("machine", JoinType.LEFT);
            var area = machine.join("area", JoinType.LEFT);

            return builder.or(
                    builder.like(builder.lower(user.get("fullName")), pattern),
                    builder.like(builder.lower(user.get("phoneNumber")), pattern),
                    builder.like(builder.lower(user.get("email")), pattern),
                    builder.like(builder.lower(machine.get("name")), pattern),
                    builder.like(builder.lower(area.get("name")), pattern)
            );
        };
    }

    public static Specification<PlaySession> hasCustomer(Integer customerId) {
        return (root, query, builder) -> customerId == null
                ? builder.conjunction()
                : builder.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<PlaySession> hasMachine(Integer machineId) {
        return (root, query, builder) -> machineId == null
                ? builder.conjunction()
                : builder.equal(root.get("machine").get("id"), machineId);
    }

    public static Specification<PlaySession> hasStatus(PlaySessionStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }
}
