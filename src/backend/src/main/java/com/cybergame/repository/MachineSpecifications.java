package com.cybergame.repository;

import com.cybergame.entity.Machine;
import com.cybergame.entity.enums.MachineStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class MachineSpecifications {

    private MachineSpecifications() {
    }

    public static Specification<Machine> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            var area = root.join("area", JoinType.LEFT);

            return builder.or(
                    builder.like(builder.lower(root.get("name")), pattern),
                    builder.like(builder.lower(root.get("cpu")), pattern),
                    builder.like(builder.lower(root.get("gpu")), pattern),
                    builder.like(builder.lower(root.get("resolution")), pattern),
                    builder.like(builder.lower(area.get("name")), pattern)
            );
        };
    }

    public static Specification<Machine> hasArea(Integer areaId) {
        return (root, query, builder) -> areaId == null
                ? builder.conjunction()
                : builder.equal(root.get("area").get("id"), areaId);
    }

    public static Specification<Machine> hasStatus(MachineStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }
}
