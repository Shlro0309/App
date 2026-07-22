package com.cybergame.dto.response;

public record AreaResponse(
        Integer id,
        String name,
        String description,
        long machineCount
) {
}
