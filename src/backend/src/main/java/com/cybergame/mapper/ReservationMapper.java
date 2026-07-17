package com.cybergame.mapper;

import com.cybergame.dto.response.ReservationMachineResponse;
import com.cybergame.dto.response.ReservationResponse;
import com.cybergame.entity.Machine;
import com.cybergame.entity.Reservation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Comparator;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ReservationMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "userId", source = "customer.user.id")
    @Mapping(target = "customerName", source = "customer.user.fullName")
    @Mapping(target = "phoneNumber", source = "customer.user.phoneNumber")
    @Mapping(target = "status", expression = "java(reservation.getStatus().name())")
    @Mapping(target = "machines", expression = "java(toMachineResponses(reservation))")
    ReservationResponse toResponse(Reservation reservation);

    @Mapping(target = "areaId", source = "area.id")
    @Mapping(target = "areaName", source = "area.name")
    @Mapping(target = "status", expression = "java(machine.getStatus().name())")
    ReservationMachineResponse toMachineResponse(Machine machine);

    default List<ReservationMachineResponse> toMachineResponses(Reservation reservation) {
        return reservation.getMachines()
                .stream()
                .sorted(Comparator.comparing(Machine::getId))
                .map(this::toMachineResponse)
                .toList();
    }
}
