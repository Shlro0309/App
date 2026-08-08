package com.cybergame.dto.response;

public record StationMachineResponse(
        Integer id,
        String name,
        String areaName,
        String status
) {
}
