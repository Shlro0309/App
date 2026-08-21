package com.cybergame.dto.response;

import java.math.BigDecimal;

public record ReportBreakdownResponse(
        String label,
        BigDecimal revenue,
        long count
) {
}
