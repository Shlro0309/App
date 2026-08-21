package com.cybergame.dto.request;

import com.cybergame.entity.enums.MachineStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record MachineCreateRequest(
        @NotBlank(message = "Tên máy trạm là bắt buộc")
        @Size(max = 20, message = "Tên máy trạm không được vượt quá 20 ký tự")
        String name,

        @NotNull(message = "Khu vực là bắt buộc")
        Integer areaId,

        @Size(max = 100, message = "CPU không được vượt quá 100 ký tự")
        String cpu,

        @Size(max = 100, message = "GPU không được vượt quá 100 ký tự")
        String gpu,

        @PositiveOrZero(message = "RAM phải lớn hơn hoặc bằng 0")
        Integer ram,

        @PositiveOrZero(message = "FPS phải lớn hơn hoặc bằng 0")
        Integer fps,

        @Size(max = 20, message = "Độ phân giải không được vượt quá 20 ký tự")
        String resolution,

        @NotNull(message = "Giá theo giờ là bắt buộc")
        @DecimalMin(value = "0.00", message = "Giá theo giờ phải lớn hơn hoặc bằng 0")
        @Digits(integer = 8, fraction = 2, message = "Giá theo giờ chỉ được có tối đa 8 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal hourlyPrice,

        MachineStatus status
) {
}
