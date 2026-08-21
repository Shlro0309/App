package com.cybergame.dto.request;

import com.cybergame.entity.enums.ServiceStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServiceItemCreateRequest(
        @NotBlank(message = "Tên dịch vụ là bắt buộc")
        @Size(max = 100, message = "Tên dịch vụ không được vượt quá 100 ký tự")
        String name,

        @DecimalMin(value = "0.00", message = "Giá phải lớn hơn hoặc bằng 0")
        @Digits(integer = 8, fraction = 2, message = "Giá chỉ được có tối đa 8 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal price,

        @Size(max = 50, message = "Loại dịch vụ không được vượt quá 50 ký tự")
        String serviceType,

        @Size(max = 255, message = "URL hình ảnh không được vượt quá 255 ký tự")
        String imageUrl,

        @Min(value = 0, message = "Số lượng tồn phải lớn hơn hoặc bằng 0")
        Integer stockQuantity,

        ServiceStatus status
) {
}
