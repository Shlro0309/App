package com.cybergame.service;

import com.cybergame.dto.request.UserCreateRequest;
import com.cybergame.dto.request.UserRoleUpdateRequest;
import com.cybergame.dto.request.UserStatusUpdateRequest;
import com.cybergame.dto.request.UserUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.RoleResponse;
import com.cybergame.dto.response.UserResponse;
import com.cybergame.entity.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserManagementService {

    Page<UserResponse> getUsers(String keyword, String role, AccountStatus status, Pageable pageable);

    UserResponse getUser(Integer id);

    UserResponse createUser(UserCreateRequest request);

    UserResponse updateUser(Integer id, UserUpdateRequest request);

    UserResponse updateStatus(Integer id, UserStatusUpdateRequest request);

    UserResponse updateRole(Integer id, UserRoleUpdateRequest request);

    MessageResponse deleteUser(Integer id);

    List<RoleResponse> getRoles();
}
