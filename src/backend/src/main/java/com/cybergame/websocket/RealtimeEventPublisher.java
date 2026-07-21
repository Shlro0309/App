package com.cybergame.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class RealtimeEventPublisher {

    public static final String REALTIME_TOPIC = "/topic/realtime";

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(RealtimeEventType type, Integer entityId, String action, String message) {
        RealtimeEvent event = new RealtimeEvent(type, entityId, action, message, LocalDateTime.now());

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    messagingTemplate.convertAndSend(REALTIME_TOPIC, event);
                }
            });
            return;
        }

        messagingTemplate.convertAndSend(REALTIME_TOPIC, event);
    }
}
