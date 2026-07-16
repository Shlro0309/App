package com.cybergame.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @Size(max = 15, message = "Phone number must not exceed 15 characters")
        String phoneNumber,

        @Email(message = "Email is invalid")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email
) {
}
