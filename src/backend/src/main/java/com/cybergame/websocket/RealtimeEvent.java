package com.cybergame.websocket;

import java.time.LocalDateTime;

public record RealtimeEvent(
        RealtimeEventType type,
        Integer entityId,
        String action,
        String message,
        LocalDateTime occurredAt
) {
}
