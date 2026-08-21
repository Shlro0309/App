package com.cybergame.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaUpsertRequest(
        @NotBlank(message = "Tên khu vực là bắt buộc")
        @Size(max = 50, message = "Tên khu vực không được vượt quá 50 ký tự")
        String name,

        @Size(max = 255, message = "Mô tả khu vực không được vượt quá 255 ký tự")
        String description
) {
}
