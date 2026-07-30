package com.cybergame.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank(message = "Tên đăng nhập là bắt buộc")
        @Size(max = 50, message = "Tên đăng nhập không được vượt quá 50 ký tự")
        String username,

        @NotBlank(message = "Mật khẩu là bắt buộc")
        @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 đến 100 ký tự")
        String password,

        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String fullName,

        @Size(max = 15, message = "Số điện thoại không được vượt quá 15 ký tự")
        String phoneNumber,

        @Email(message = "Email không hợp lệ")
        @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
        String email,

        @NotBlank(message = "Vai trò là bắt buộc")
        @Pattern(regexp = "ADMIN|EMPLOYEE|CUSTOMER", message = "Vai trò phải là ADMIN, EMPLOYEE hoặc CUSTOMER")
        String role
) {
}
