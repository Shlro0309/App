package com.cybergame.mapper;

import com.cybergame.dto.response.AreaResponse;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.entity.Area;
import com.cybergame.entity.Machine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MachineMapper {

    @Mapping(target = "machineCount", expression = "java(area.getMachines() == null ? 0L : area.getMachines().size())")
    AreaResponse toAreaResponse(Area area);

    @Mapping(target = "areaId", source = "area.id")
    @Mapping(target = "areaName", source = "area.name")
    @Mapping(target = "status", expression = "java(machine.getStatus().name())")
    MachineResponse toResponse(Machine machine);
}
