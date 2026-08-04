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
import com.cybergame.entity.PlaySession;
import com.cybergame.entity.enums.MachineStatus;
import com.cybergame.entity.enums.PlaySessionStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.MachineMapper;
import com.cybergame.repository.AreaRepository;
import com.cybergame.repository.MachineRepository;
import com.cybergame.repository.MachineSpecifications;
import com.cybergame.repository.PlaySessionRepository;
import com.cybergame.service.MachineManagementService;
import com.cybergame.websocket.RealtimeEventPublisher;
import com.cybergame.websocket.RealtimeEventType;
import jakarta.persistence.EntityManager;
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
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MachineManagementServiceImpl implements MachineManagementService {

    private static final String UNCATEGORIZED_AREA_NAME = "Chưa phân khu";
    private static final String UNCATEGORIZED_AREA_DESCRIPTION = "Khu vực tự động cho máy chưa được phân khu";

    private final MachineRepository machineRepository;
    private final AreaRepository areaRepository;
    private final PlaySessionRepository playSessionRepository;
    private final MachineMapper machineMapper;
    private final RealtimeEventPublisher realtimeEventPublisher;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public Page<MachineResponse> getMachines(String keyword, Integer areaId, MachineStatus status, Pageable pageable) {
        Specification<Machine> specification = Specification
                .where(MachineSpecifications.hasKeyword(keyword))
                .and(MachineSpecifications.hasArea(areaId))
                .and(MachineSpecifications.hasStatus(status));

        Page<Machine> machinePage = machineRepository.findAll(specification, pageable);
        Map<Integer, PlaySession> activeSessions = findActiveSessionsByMachine(machinePage.getContent());

        return machinePage.map(machine -> toMachineResponse(machine, activeSessions.get(machine.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public MachineResponse getMachine(Integer id) {
        Machine machine = getMachineById(id);
        PlaySession activeSession = playSessionRepository
                .findFirstByMachineIdAndStatus(machine.getId(), PlaySessionStatus.ACTIVE)
                .orElse(null);
        return toMachineResponse(machine, activeSession);
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
                "Đã tạo máy trạm"
        );
        return toMachineResponse(savedMachine, null);
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
                "Đã cập nhật máy trạm"
        );
        return toMachineResponse(savedMachine, null);
    }

    @Override
    @Transactional
    public MachineResponse updateStatus(Integer id, MachineStatusUpdateRequest request) {
        Machine machine = getMachineById(id);
        validateStatusTransition(machine, request.status());
        machine.setStatus(request.status());
        Machine savedMachine = machineRepository.save(machine);
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                savedMachine.getId(),
                savedMachine.getStatus().name(),
                "Trạng thái máy trạm đã thay đổi"
        );
        PlaySession activeSession = playSessionRepository
                .findFirstByMachineIdAndStatus(savedMachine.getId(), PlaySessionStatus.ACTIVE)
                .orElse(null);
        return toMachineResponse(savedMachine, activeSession);
    }

    @Override
    @Transactional
    public MessageResponse deleteMachine(Integer id) {
        Machine machine = getMachineById(id);
        if (playSessionRepository.existsByMachineIdAndStatus(machine.getId(), PlaySessionStatus.ACTIVE)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Không thể xóa máy trạm đang có phiên chơi hoạt động");
        }

        hardDeleteMachine(machine.getId());
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                machine.getId(),
                "DELETED",
                "Đã xóa máy trạm"
        );
        return new MessageResponse("Đã xóa máy trạm");
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
                        "Không thể xóa khu vực chưa phân khu khi vẫn còn máy được gán vào"
                );
            }
            Area fallbackArea = getOrCreateUncategorizedArea(area.getId());
            machines.forEach(machine -> machine.setArea(fallbackArea));
            machineRepository.saveAll(machines);
        }

        areaRepository.delete(area);
        publishAreaChanged(area, "DELETED");
        machines.forEach(machine -> publishMachineChanged(machine, "AREA_REASSIGNED"));
        return new MessageResponse("Đã xóa khu vực và chuyển máy sang khu vực chưa phân khu");
    }

    @Override
    public List<String> getStatuses() {
        return Arrays.stream(MachineStatus.values())
                .map(Enum::name)
                .toList();
    }

    private Machine getMachineById(Integer id) {
        return machineRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy trạm"));
    }

    private Map<Integer, PlaySession> findActiveSessionsByMachine(List<Machine> machines) {
        List<Integer> machineIds = machines.stream()
                .map(Machine::getId)
                .toList();

        if (machineIds.isEmpty()) {
            return Map.of();
        }

        return playSessionRepository.findByMachineIdInAndStatus(machineIds, PlaySessionStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(
                        playSession -> playSession.getMachine().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));
    }

    private MachineResponse toMachineResponse(Machine machine, PlaySession activeSession) {
        String currentUsername = activeSession == null
                ? null
                : activeSession.getCustomer().getUser().getUsername();

        return new MachineResponse(
                machine.getId(),
                machine.getName(),
                machine.getArea().getId(),
                machine.getArea().getName(),
                machine.getCpu(),
                machine.getGpu(),
                machine.getRam(),
                machine.getFps(),
                machine.getResolution(),
                machine.getHourlyPrice(),
                machine.getStatus().name(),
                activeSession == null ? null : activeSession.getId(),
                currentUsername,
                machine.getAddedAt()
        );
    }

    private void validateStatusTransition(Machine machine, MachineStatus nextStatus) {
        if (
                machine.getStatus() == MachineStatus.PLAYING
                        && (nextStatus == MachineStatus.RESERVED || nextStatus == MachineStatus.MAINTENANCE)
        ) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Không thể chuyển máy đang chơi sang trạng thái đã đặt hoặc bảo trì"
            );
        }
    }

    private void hardDeleteMachine(Integer machineId) {
        executeNative("DELETE FROM dbo.troChoi_mayTram WHERE maMay = :machineId", machineId);
        executeNative("DELETE FROM dbo.datCho_mayTram WHERE maMay = :machineId", machineId);
        executeNative("""
                DELETE FROM dbo.hoaDon
                WHERE maPhien IN (SELECT maPhien FROM dbo.phienChoi WHERE maMay = :machineId)
                   OR maDonHang IN (
                        SELECT maDonHang
                        FROM dbo.donHang
                        WHERE maPhien IN (SELECT maPhien FROM dbo.phienChoi WHERE maMay = :machineId)
                   )
                """, machineId);
        executeNative("""
                DELETE FROM dbo.chiTietDonHang
                WHERE maDonHang IN (
                    SELECT maDonHang
                    FROM dbo.donHang
                    WHERE maPhien IN (SELECT maPhien FROM dbo.phienChoi WHERE maMay = :machineId)
                )
                """, machineId);
        executeNative("""
                DELETE FROM dbo.donHang
                WHERE maPhien IN (SELECT maPhien FROM dbo.phienChoi WHERE maMay = :machineId)
                """, machineId);
        executeNative("DELETE FROM dbo.lichSuBaoTri WHERE maMay = :machineId", machineId);
        executeNative("DELETE FROM dbo.phienChoi WHERE maMay = :machineId", machineId);
        executeNative("DELETE FROM dbo.mayTram WHERE maMay = :machineId", machineId);
    }

    private void executeNative(String sql, Integer machineId) {
        entityManager.createNativeQuery(sql)
                .setParameter("machineId", machineId)
                .executeUpdate();
    }

    private Area getArea(Integer areaId) {
        return areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khu vực"));
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
            throw new BusinessException(HttpStatus.CONFLICT, "Tên máy trạm đã tồn tại");
        }
    }

    private void validateUniqueAreaName(Integer currentAreaId, String name) {
        boolean exists = currentAreaId == null
                ? areaRepository.existsByNameIgnoreCase(name)
                : areaRepository.existsByNameIgnoreCaseAndIdNot(name, currentAreaId);

        if (exists) {
            throw new BusinessException(HttpStatus.CONFLICT, "Tên khu vực đã tồn tại");
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
                "Khu vực máy trạm đã thay đổi"
        );
    }

    private void publishMachineChanged(Machine machine, String action) {
        realtimeEventPublisher.publish(
                RealtimeEventType.MACHINE_STATUS_CHANGED,
                machine.getId(),
                action,
                "Máy trạm đã thay đổi"
        );
    }
}
