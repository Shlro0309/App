package com.cybergame.service;

import com.cybergame.dto.request.PlaySessionReservationStartRequest;
import com.cybergame.dto.request.PlaySessionStartRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.PlaySessionResponse;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PlaySessionService {

    Page<PlaySessionResponse> getPlaySessions(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            Integer machineId,
            PlaySessionStatus status,
            Pageable pageable
    );

    PlaySessionResponse getPlaySession(CurrentUser currentUser, Integer id);

    PlaySessionResponse startSession(CurrentUser currentUser, PlaySessionStartRequest request);

    List<PlaySessionResponse> startFromReservation(
            CurrentUser currentUser,
            PlaySessionReservationStartRequest request
    );

    PlaySessionResponse endSession(CurrentUser currentUser, Integer id);

    MessageResponse cancelSession(CurrentUser currentUser, Integer id);

    List<String> getStatuses();
}
