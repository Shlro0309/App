import { httpClient } from "@/api/httpClient";
import type {
  AvailableMachineFilters,
  PageResponse,
  Reservation,
  ReservationFilters,
  ReservationFormValues,
  ReservationMachine,
  ReservationStatus,
  StationMachine,
  StationReservation,
} from "./types";

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : undefined;
}

function toReservationPayload(values: ReservationFormValues) {
  return {
    customerId: optionalNumber(values.customerId),
    expiresAt: values.expiresAt,
    deposit: values.deposit.trim().length > 0 ? Number(values.deposit) : 0,
    machineIds: values.machineIds,
  };
}

export async function getReservations(filters: ReservationFilters) {
  const response = await httpClient.get<PageResponse<Reservation>>(
    "/reservations",
    {
      params: {
        keyword: filters.keyword || undefined,
        customerId: filters.customerId || undefined,
        status: filters.status || undefined,
        page: filters.page,
        size: filters.size,
        sort: "reservedAt,desc",
      },
    }
  );

  return response.data;
}

export async function getReservationStatuses() {
  const response = await httpClient.get<ReservationStatus[]>(
    "/reservations/statuses"
  );
  return response.data;
}

export async function getAvailableReservationMachines(
  filters: AvailableMachineFilters
) {
  const response = await httpClient.get<PageResponse<ReservationMachine>>(
    "/reservations/available-machines",
    {
      params: {
        keyword: filters.keyword || undefined,
        areaId: filters.areaId || undefined,
        page: filters.page,
        size: filters.size,
        sort: "id,asc",
      },
    }
  );

  return response.data;
}

export async function getReservationMachines(filters: AvailableMachineFilters) {
  const response = await httpClient.get<PageResponse<ReservationMachine>>(
    "/reservations/reservation-machines",
    {
      params: {
        keyword: filters.keyword || undefined,
        areaId: filters.areaId || undefined,
        page: filters.page,
        size: filters.size,
        sort: "id,asc",
      },
    }
  );

  return response.data;
}

export async function getStationActiveReservation(machineId: number) {
  const response = await httpClient.get<StationReservation | null>(
    "/reservations/station-active",
    {
      params: { machineId },
    }
  );

  return response.data;
}

export async function getStationMachine(machineId: number) {
  const response = await httpClient.get<StationMachine>(
    "/reservations/station-machine",
    {
      params: { machineId },
    }
  );

  return response.data;
}

export async function createReservation(values: ReservationFormValues) {
  const response = await httpClient.post<Reservation>(
    "/reservations",
    toReservationPayload(values)
  );
  return response.data;
}

export async function updateReservationStatus(
  id: number,
  status: ReservationStatus
) {
  const response = await httpClient.patch<Reservation>(
    `/reservations/${id}/status`,
    { status }
  );
  return response.data;
}

export async function cancelReservation(id: number) {
  await httpClient.patch(`/reservations/${id}/cancel`);
}
