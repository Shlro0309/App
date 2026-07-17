import { httpClient } from "@/api/httpClient";
import type {
  Area,
  Machine,
  MachineFilters,
  MachineFormValues,
  MachineStatus,
  PageResponse,
} from "./types";

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}

function toMachinePayload(values: MachineFormValues) {
  return {
    name: values.name.trim(),
    areaId: Number(values.areaId),
    cpu: toNullableText(values.cpu),
    gpu: toNullableText(values.gpu),
    ram: toNullableNumber(values.ram),
    fps: toNullableNumber(values.fps),
    resolution: toNullableText(values.resolution),
    hourlyPrice: Number(values.hourlyPrice),
    status: values.status,
  };
}

function toMachineUpdatePayload(values: MachineFormValues) {
  const payload = toMachinePayload(values);
  return {
    name: payload.name,
    areaId: payload.areaId,
    cpu: payload.cpu,
    gpu: payload.gpu,
    ram: payload.ram,
    fps: payload.fps,
    resolution: payload.resolution,
    hourlyPrice: payload.hourlyPrice,
  };
}

export async function getMachines(filters: MachineFilters) {
  const response = await httpClient.get<PageResponse<Machine>>("/machines", {
    params: {
      keyword: filters.keyword || undefined,
      areaId: filters.areaId || undefined,
      status: filters.status || undefined,
      page: filters.page,
      size: filters.size,
      sort: "id,asc",
    },
  });

  return response.data;
}

export async function getMachineAreas() {
  const response = await httpClient.get<Area[]>("/machines/areas");
  return response.data;
}

export async function getMachineStatuses() {
  const response = await httpClient.get<MachineStatus[]>("/machines/statuses");
  return response.data;
}

export async function createMachine(values: MachineFormValues) {
  const response = await httpClient.post<Machine>(
    "/machines",
    toMachinePayload(values)
  );
  return response.data;
}

export async function updateMachine(id: number, values: MachineFormValues) {
  const response = await httpClient.put<Machine>(
    `/machines/${id}`,
    toMachineUpdatePayload(values)
  );
  return response.data;
}

export async function updateMachineStatus(id: number, status: MachineStatus) {
  const response = await httpClient.patch<Machine>(`/machines/${id}/status`, {
    status,
  });
  return response.data;
}

export async function setMachineOffline(id: number) {
  await httpClient.delete(`/machines/${id}`);
}
