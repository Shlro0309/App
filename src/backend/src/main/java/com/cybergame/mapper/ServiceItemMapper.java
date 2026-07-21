package com.cybergame.mapper;

import com.cybergame.dto.response.ServiceItemResponse;
import com.cybergame.entity.ServiceItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ServiceItemMapper {

    @Mapping(target = "status", expression = "java(serviceItem.getStatus().name())")
    ServiceItemResponse toResponse(ServiceItem serviceItem);
}
