package com.cybergame.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserRoleUpdateRequest(
        @NotBlank(message = "Vai trò là bắt buộc")
        @Pattern(regexp = "ADMIN|EMPLOYEE|CUSTOMER", message = "Vai trò phải là ADMIN, EMPLOYEE hoặc CUSTOMER")
        String role
) {
}
