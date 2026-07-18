package com.cybergame.mapper;

import com.cybergame.dto.response.PlaySessionResponse;
import com.cybergame.entity.PlaySession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.Duration;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface PlaySessionMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "userId", source = "customer.user.id")
    @Mapping(target = "customerName", source = "customer.user.fullName")
    @Mapping(target = "phoneNumber", source = "customer.user.phoneNumber")
    @Mapping(target = "machineId", source = "machine.id")
    @Mapping(target = "machineName", source = "machine.name")
    @Mapping(target = "areaId", source = "machine.area.id")
    @Mapping(target = "areaName", source = "machine.area.name")
    @Mapping(target = "hourlyPrice", source = "machine.hourlyPrice")
    @Mapping(target = "durationMinutes", expression = "java(durationMinutes(playSession))")
    @Mapping(target = "status", expression = "java(playSession.getStatus().name())")
    PlaySessionResponse toResponse(PlaySession playSession);

    default Long durationMinutes(PlaySession playSession) {
        if (playSession.getStartedAt() == null) {
            return 0L;
        }

        LocalDateTime endedAt = playSession.getEndedAt() == null
                ? LocalDateTime.now()
                : playSession.getEndedAt();
        return Math.max(Duration.between(playSession.getStartedAt(), endedAt).toMinutes(), 0L);
    }
}
