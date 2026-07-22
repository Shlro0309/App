package com.cybergame.mapper;

import com.cybergame.dto.response.RoleResponse;
import com.cybergame.dto.response.UserResponse;
import com.cybergame.entity.Role;
import com.cybergame.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "role", source = "role.name")
    @Mapping(target = "status", expression = "java(user.getStatus().name())")
    @Mapping(target = "customerId", expression = "java(user.getCustomer() == null ? null : user.getCustomer().getId())")
    @Mapping(target = "customerBalance", expression = "java(user.getCustomer() == null ? null : user.getCustomer().getBalance())")
    @Mapping(target = "employeeId", expression = "java(user.getEmployee() == null ? null : user.getEmployee().getId())")
    UserResponse toResponse(User user);

    RoleResponse toRoleResponse(Role role);
}
