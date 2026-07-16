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
        @NotBlank(message = "Machine name is required")
        @Size(max = 20, message = "Machine name must not exceed 20 characters")
        String name,

        @NotNull(message = "Area is required")
        Integer areaId,

        @Size(max = 100, message = "CPU must not exceed 100 characters")
        String cpu,

        @Size(max = 100, message = "GPU must not exceed 100 characters")
        String gpu,

        @PositiveOrZero(message = "RAM must be greater than or equal to 0")
        Integer ram,

        @PositiveOrZero(message = "FPS must be greater than or equal to 0")
        Integer fps,

        @Size(max = 20, message = "Resolution must not exceed 20 characters")
        String resolution,

        @NotNull(message = "Hourly price is required")
        @DecimalMin(value = "0.00", message = "Hourly price must be greater than or equal to 0")
        @Digits(integer = 8, fraction = 2, message = "Hourly price must have up to 8 integer digits and 2 fraction digits")
        BigDecimal hourlyPrice,

        MachineStatus status
) {
}
