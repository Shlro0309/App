package com.cybergame.service;

import com.cybergame.dto.request.UserBalanceUpdateRequest;
import com.cybergame.dto.request.UserCreateRequest;
import com.cybergame.dto.request.UserRoleUpdateRequest;
import com.cybergame.dto.request.UserStatusUpdateRequest;
import com.cybergame.dto.request.UserUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.RoleResponse;
import com.cybergame.dto.response.UserResponse;
import com.cybergame.entity.enums.AccountStatus;
import com.cybergame.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserManagementService {

    Page<UserResponse> getUsers(CurrentUser currentUser, String keyword, String role, AccountStatus status, Pageable pageable);

    UserResponse getUser(CurrentUser currentUser, Integer id);

    UserResponse createUser(CurrentUser currentUser, UserCreateRequest request);

    UserResponse updateUser(CurrentUser currentUser, Integer id, UserUpdateRequest request);

    UserResponse updateStatus(CurrentUser currentUser, Integer id, UserStatusUpdateRequest request);

    UserResponse updateRole(CurrentUser currentUser, Integer id, UserRoleUpdateRequest request);

    UserResponse updateBalance(CurrentUser currentUser, Integer id, UserBalanceUpdateRequest request);

    MessageResponse deleteUser(CurrentUser currentUser, Integer id);

    List<RoleResponse> getRoles(CurrentUser currentUser);
}
