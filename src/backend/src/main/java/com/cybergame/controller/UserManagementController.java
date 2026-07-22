package com.cybergame.controller;

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
import com.cybergame.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    public Page<UserResponse> getUsers(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) AccountStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return userManagementService.getUsers(currentUser, keyword, role, status, pageable);
    }

    @GetMapping("/{id}")
    public UserResponse getUser(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return userManagementService.getUser(currentUser, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody UserCreateRequest request
    ) {
        return userManagementService.createUser(currentUser, request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        return userManagementService.updateUser(currentUser, id, request);
    }

    @PatchMapping("/{id}/status")
    public UserResponse updateStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        return userManagementService.updateStatus(currentUser, id, request);
    }

    @PatchMapping("/{id}/role")
    public UserResponse updateRole(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody UserRoleUpdateRequest request
    ) {
        return userManagementService.updateRole(currentUser, id, request);
    }

    @PatchMapping("/{id}/balance")
    public UserResponse updateBalance(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id,
            @Valid @RequestBody UserBalanceUpdateRequest request
    ) {
        return userManagementService.updateBalance(currentUser, id, request);
    }

    @DeleteMapping("/{id}")
    public MessageResponse deleteUser(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer id
    ) {
        return userManagementService.deleteUser(currentUser, id);
    }

    @GetMapping("/roles")
    public List<RoleResponse> getRoles(@AuthenticationPrincipal CurrentUser currentUser) {
        return userManagementService.getRoles(currentUser);
    }
}
