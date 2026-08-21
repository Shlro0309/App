package com.cybergame.service;

import com.cybergame.dto.request.ReservationCreateRequest;
import com.cybergame.dto.request.ReservationStatusUpdateRequest;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.ReservationResponse;
import com.cybergame.dto.response.StationMachineResponse;
import com.cybergame.dto.response.StationReservationResponse;
import com.cybergame.entity.enums.ReservationStatus;
import com.cybergame.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReservationService {

    Page<ReservationResponse> getReservations(
            CurrentUser currentUser,
            String keyword,
            Integer customerId,
            ReservationStatus status,
            Pageable pageable
    );

    ReservationResponse getReservation(CurrentUser currentUser, Integer id);

    ReservationResponse createReservation(CurrentUser currentUser, ReservationCreateRequest request);

    ReservationResponse updateStatus(CurrentUser currentUser, Integer id, ReservationStatusUpdateRequest request);

    MessageResponse cancelReservation(CurrentUser currentUser, Integer id);

    Page<MachineResponse> getReservationMachines(String keyword, Integer areaId, Pageable pageable);

    Page<MachineResponse> getAvailableMachines(String keyword, Integer areaId, Pageable pageable);

    StationMachineResponse getStationMachine(Integer machineId);

    StationReservationResponse getStationReservation(Integer machineId);

    List<String> getStatuses();
}
