package com.cybergame.repository;

import com.cybergame.entity.User;
import com.cybergame.entity.enums.AccountStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<User> hasKeyword(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern)
            );
        };
    }

    public static Specification<User> hasRole(String role) {
        return (root, query, criteriaBuilder) -> {
            if (role == null || role.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    criteriaBuilder.upper(root.join("role", JoinType.INNER).get("name")),
                    role.trim().toUpperCase()
            );
        };
    }

    public static Specification<User> hasStatus(AccountStatus status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(root.get("status"), status);
        };
    }
}
