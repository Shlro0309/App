package com.cybergame.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Mật khẩu hiện tại là bắt buộc")
        String currentPassword,

        @NotBlank(message = "Mật khẩu mới là bắt buộc")
        @Size(min = 8, max = 100, message = "Mật khẩu mới phải có từ 8 đến 100 ký tự")
        String newPassword
) {
}
