package com.cybergame.service.impl;

import com.cybergame.dto.request.AreaUpsertRequest;
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
import com.cybergame.websocket.RealtimeEventPublisher;
import com.cybergame.websocket.RealtimeEventType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MachineManagementServiceImpl implements MachineManagementService {

    private static final String UNCATEGORIZED_AREA_NAME = "Chưa phân khu";
    private static final String UNCATEGORIZED_AREA_DESCRIPTION = "Khu vực tự động cho máy chưa được phân khu";

    private final MachineRepository machineRepository;
    private final AreaRepository areaRepository;
    private final MachineMapper machineMapper;
    private final RealtimeEventPublisher realtimeEventPublisher;

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

        Machine savedMachine = machineRepository.save(machine);
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                savedMachine.getId(),
                "CREATED",
                "Machine has been created"
        );
        return machineMapper.toResponse(savedMachine);
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

        Machine savedMachine = machineRepository.save(machine);
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                savedMachine.getId(),
                "UPDATED",
                "Machine has been updated"
        );
        return machineMapper.toResponse(savedMachine);
    }

    @Override
    @Transactional
    public MachineResponse updateStatus(Integer id, MachineStatusUpdateRequest request) {
        Machine machine = getMachineById(id);
        machine.setStatus(request.status());
        Machine savedMachine = machineRepository.save(machine);
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                savedMachine.getId(),
                savedMachine.getStatus().name(),
                "Machine status has changed"
        );
        return machineMapper.toResponse(savedMachine);
    }

    @Override
    @Transactional
    public MessageResponse deleteMachine(Integer id) {
        Machine machine = getMachineById(id);
        machine.setStatus(MachineStatus.OFFLINE);
        machineRepository.save(machine);
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                machine.getId(),
                MachineStatus.OFFLINE.name(),
                "Machine has been set to OFFLINE"
        );
        return new MessageResponse("Machine has been set to OFFLINE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaResponse> getAreas() {
        return areaRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Area::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toAreaResponse)
                .toList();
    }

    @Override
    @Transactional
    public AreaResponse createArea(AreaUpsertRequest request) {
        String name = normalizeRequired(request.name());
        validateUniqueAreaName(null, name);

        Area area = new Area();
        area.setName(name);
        area.setDescription(normalizeBlank(request.description()));

        Area savedArea = areaRepository.save(area);
        publishAreaChanged(savedArea, "CREATED");
        return toAreaResponse(savedArea);
    }

    @Override
    @Transactional
    public AreaResponse updateArea(Integer id, AreaUpsertRequest request) {
        Area area = getArea(id);
        String name = normalizeRequired(request.name());
        validateUniqueAreaName(area.getId(), name);

        area.setName(name);
        area.setDescription(normalizeBlank(request.description()));

        Area savedArea = areaRepository.save(area);
        publishAreaChanged(savedArea, "UPDATED");
        return toAreaResponse(savedArea);
    }

    @Override
    @Transactional
    public MessageResponse deleteArea(Integer id) {
        Area area = getArea(id);
        List<Machine> machines = machineRepository.findByAreaId(area.getId());

        if (!machines.isEmpty()) {
            if (UNCATEGORIZED_AREA_NAME.equalsIgnoreCase(area.getName())) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "Uncategorized area cannot be deleted while machines are assigned"
                );
            }
            Area fallbackArea = getOrCreateUncategorizedArea(area.getId());
            machines.forEach(machine -> machine.setArea(fallbackArea));
            machineRepository.saveAll(machines);
        }

        areaRepository.delete(area);
        publishAreaChanged(area, "DELETED");
        machines.forEach(machine -> publishMachineChanged(machine, "AREA_REASSIGNED"));
        return new MessageResponse("Area has been deleted and machines have been moved to uncategorized area");
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

    private Area getOrCreateUncategorizedArea(Integer excludedAreaId) {
        return areaRepository.findByNameIgnoreCase(UNCATEGORIZED_AREA_NAME)
                .filter(area -> !area.getId().equals(excludedAreaId))
                .orElseGet(() -> {
                    Area fallbackArea = new Area();
                    fallbackArea.setName(UNCATEGORIZED_AREA_NAME);
                    fallbackArea.setDescription(UNCATEGORIZED_AREA_DESCRIPTION);
                    Area savedArea = areaRepository.save(fallbackArea);
                    publishAreaChanged(savedArea, "CREATED");
                    return savedArea;
                });
    }

    private void validateUniqueName(Integer currentMachineId, String name) {
        boolean exists = currentMachineId == null
                ? machineRepository.existsByNameIgnoreCase(name)
                : machineRepository.existsByNameIgnoreCaseAndIdNot(name, currentMachineId);

        if (exists) {
            throw new BusinessException(HttpStatus.CONFLICT, "Machine name already exists");
        }
    }

    private void validateUniqueAreaName(Integer currentAreaId, String name) {
        boolean exists = currentAreaId == null
                ? areaRepository.existsByNameIgnoreCase(name)
                : areaRepository.existsByNameIgnoreCaseAndIdNot(name, currentAreaId);

        if (exists) {
            throw new BusinessException(HttpStatus.CONFLICT, "Area name already exists");
        }
    }

    private AreaResponse toAreaResponse(Area area) {
        return new AreaResponse(
                area.getId(),
                area.getName(),
                area.getDescription(),
                machineRepository.countByAreaId(area.getId())
        );
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void publishAreaChanged(Area area, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_AREA_CHANGED,
                area.getId(),
                action,
                "Machine area has changed"
        );
    }

    private void publishMachineChanged(Machine machine, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                machine.getId(),
                action,
                "Machine has changed"
        );
    }
}
