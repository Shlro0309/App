package com.cybergame.dto.request;

import com.cybergame.entity.enums.ServiceStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServiceItemCreateRequest(
        @NotBlank(message = "Service name is required")
        @Size(max = 100, message = "Service name must have at most 100 characters")
        String name,

        @DecimalMin(value = "0.00", message = "Price must be greater than or equal to 0")
        @Digits(integer = 8, fraction = 2, message = "Price must have up to 8 integer digits and 2 fraction digits")
        BigDecimal price,

        @Size(max = 50, message = "Service type must have at most 50 characters")
        String serviceType,

        @Size(max = 255, message = "Image URL must have at most 255 characters")
        String imageUrl,

        @Min(value = 0, message = "Stock quantity must be greater than or equal to 0")
        Integer stockQuantity,

        ServiceStatus status
) {
}
