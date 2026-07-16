package com.cybergame.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserRoleUpdateRequest(
        @NotBlank(message = "Role is required")
        @Pattern(regexp = "ADMIN|EMPLOYEE|CUSTOMER", message = "Role must be ADMIN, EMPLOYEE, or CUSTOMER")
        String role
) {
}
