package com.cybergame.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Tên đăng nhập là bắt buộc")
        @Size(min = 4, max = 50, message = "Tên đăng nhập phải có từ 4 đến 50 ký tự")
        String username,

        @NotBlank(message = "Mật khẩu là bắt buộc")
        @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 đến 100 ký tự")
        String password,

        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String fullName,

        @Pattern(regexp = "^[0-9+\\-\\s]{9,15}$", message = "Số điện thoại không hợp lệ")
        String phoneNumber,

        @Email(message = "Email không hợp lệ")
        @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
        String email
) {
}
