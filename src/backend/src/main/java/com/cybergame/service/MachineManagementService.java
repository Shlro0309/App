package com.cybergame.service;

import com.cybergame.dto.request.MachineCreateRequest;
import com.cybergame.dto.request.AreaUpsertRequest;
import com.cybergame.dto.request.MachineStatusUpdateRequest;
import com.cybergame.dto.request.MachineUpdateRequest;
import com.cybergame.dto.response.AreaResponse;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.entity.enums.MachineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MachineManagementService {

    Page<MachineResponse> getMachines(String keyword, Integer areaId, MachineStatus status, Pageable pageable);

    MachineResponse getMachine(Integer id);

    MachineResponse createMachine(MachineCreateRequest request);

    MachineResponse updateMachine(Integer id, MachineUpdateRequest request);

    MachineResponse updateStatus(Integer id, MachineStatusUpdateRequest request);

    MessageResponse deleteMachine(Integer id);

    List<AreaResponse> getAreas();

    AreaResponse createArea(AreaUpsertRequest request);

    AreaResponse updateArea(Integer id, AreaUpsertRequest request);

    MessageResponse deleteArea(Integer id);

    List<String> getStatuses();
}
