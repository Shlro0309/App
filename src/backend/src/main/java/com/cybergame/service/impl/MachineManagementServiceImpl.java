package com.cybergame.service.impl;

import com.cybergame.dto.request.MachineCreateRequest;
import com.cybergame.dto.request.MachineStatusUpdateRequest;
import com.cybergame.dto.request.MachineUpdateRequest;
import com.cybergame.dto.response.AreaResponse;
import com.cybergame.dto.response.MachineResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.entity.Area;
import com.cybergame.entity.Machine;
import com.cybergame.entity.enums.MachineStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.MachineMapper;
import com.cybergame.repository.AreaRepository;
import com.cybergame.repository.MachineRepository;
import com.cybergame.repository.MachineSpecifications;
import com.cybergame.service.MachineManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MachineManagementServiceImpl implements MachineManagementService {

    private final MachineRepository machineRepository;
    private final AreaRepository areaRepository;
    private final MachineMapper machineMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<MachineResponse> getMachines(String keyword, Integer areaId, MachineStatus status, Pageable pageable) {
        Specification<Machine> specification = Specification
                .where(MachineSpecifications.hasKeyword(keyword))
                .and(MachineSpecifications.hasArea(areaId))
                .and(MachineSpecifications.hasStatus(status));

        return machineRepository.findAll(specification, pageable)
                .map(machineMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public MachineResponse getMachine(Integer id) {
        return machineMapper.toResponse(getMachineById(id));
    }

    @Override
    @Transactional
    public MachineResponse createMachine(MachineCreateRequest request) {
        String name = normalizeRequired(request.name());
        validateUniqueName(null, name);

        Machine machine = new Machine();
        machine.setName(name);
        machine.setArea(getArea(request.areaId()));
        machine.setCpu(normalizeBlank(request.cpu()));
        machine.setGpu(normalizeBlank(request.gpu()));
        machine.setRam(request.ram());
        machine.setFps(request.fps());
        machine.setResolution(normalizeBlank(request.resolution()));
        machine.setHourlyPrice(request.hourlyPrice());
        machine.setStatus(request.status() == null ? MachineStatus.AVAILABLE : request.status());
        machine.setAddedAt(LocalDateTime.now());

        return machineMapper.toResponse(machineRepository.save(machine));
    }

    @Override
    @Transactional
    public MachineResponse updateMachine(Integer id, MachineUpdateRequest request) {
        Machine machine = getMachineById(id);
        String name = normalizeRequired(request.name());
        validateUniqueName(machine.getId(), name);

        machine.setName(name);
        machine.setArea(getArea(request.areaId()));
        machine.setCpu(normalizeBlank(request.cpu()));
        machine.setGpu(normalizeBlank(request.gpu()));
        machine.setRam(request.ram());
        machine.setFps(request.fps());
        machine.setResolution(normalizeBlank(request.resolution()));
        machine.setHourlyPrice(request.hourlyPrice());

        return machineMapper.toResponse(machineRepository.save(machine));
    }

    @Override
    @Transactional
    public MachineResponse updateStatus(Integer id, MachineStatusUpdateRequest request) {
        Machine machine = getMachineById(id);
        machine.setStatus(request.status());
        return machineMapper.toResponse(machineRepository.save(machine));
    }

    @Override
    @Transactional
    public MessageResponse deleteMachine(Integer id) {
        Machine machine = getMachineById(id);
        machine.setStatus(MachineStatus.OFFLINE);
        machineRepository.save(machine);
        return new MessageResponse("Machine has been set to OFFLINE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaResponse> getAreas() {
        return areaRepository.findAll()
                .stream()
                .map(machineMapper::toAreaResponse)
                .toList();
    }

    @Override
    public List<String> getStatuses() {
        return Arrays.stream(MachineStatus.values())
                .map(Enum::name)
                .toList();
    }

    private Machine getMachineById(Integer id) {
        return machineRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found"));
    }

    private Area getArea(Integer areaId) {
        return areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found"));
    }

    private void validateUniqueName(Integer currentMachineId, String name) {
        boolean exists = currentMachineId == null
                ? machineRepository.existsByNameIgnoreCase(name)
                : machineRepository.existsByNameIgnoreCaseAndIdNot(name, currentMachineId);

        if (exists) {
            throw new BusinessException(HttpStatus.CONFLICT, "Machine name already exists");
        }
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
