package com.cybergame.dto.response;

import java.math.BigDecimal;

public record ReportServiceSalesResponse(
        Integer serviceId,
        String serviceName,
        String serviceType,
        long quantity,
        BigDecimal revenue
) {
}
