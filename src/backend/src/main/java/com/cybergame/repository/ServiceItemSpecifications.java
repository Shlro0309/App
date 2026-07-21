package com.cybergame.repository;

import com.cybergame.entity.ServiceItem;
import com.cybergame.entity.enums.ServiceStatus;
import org.springframework.data.jpa.domain.Specification;

public final class ServiceItemSpecifications {

    private ServiceItemSpecifications() {
    }

    public static Specification<ServiceItem> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return builder.or(
                    builder.like(builder.lower(root.get("name")), pattern),
                    builder.like(builder.lower(root.get("serviceType")), pattern)
            );
        };
    }

    public static Specification<ServiceItem> hasServiceType(String serviceType) {
        return (root, query, builder) -> serviceType == null || serviceType.isBlank()
                ? builder.conjunction()
                : builder.equal(builder.lower(root.get("serviceType")), serviceType.trim().toLowerCase());
    }

    public static Specification<ServiceItem> hasStatus(ServiceStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }
}
