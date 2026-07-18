import { httpClient } from "@/api/httpClient";
import type {
  DirectStartValues,
  PageResponse,
  PlaySession,
  PlaySessionFilters,
  PlaySessionStatus,
  ReservationStartValues,
} from "./types";

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : undefined;
}

function toMachineIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);
}

export async function getPlaySessions(filters: PlaySessionFilters) {
  const response = await httpClient.get<PageResponse<PlaySession>>(
    "/play-sessions",
    {
      params: {
        keyword: filters.keyword || undefined,
        customerId: filters.customerId || undefined,
        machineId: filters.machineId || undefined,
        status: filters.status || undefined,
        page: filters.page,
        size: filters.size,
        sort: "startedAt,desc",
      },
    }
  );

  return response.data;
}

export async function getPlaySessionStatuses() {
  const response = await httpClient.get<PlaySessionStatus[]>(
    "/play-sessions/statuses"
  );
  return response.data;
}

export async function startPlaySession(values: DirectStartValues) {
  const response = await httpClient.post<PlaySession>("/play-sessions", {
    customerId: optionalNumber(values.customerId),
    machineId: Number(values.machineId),
  });
  return response.data;
}

export async function startPlaySessionFromReservation(
  values: ReservationStartValues
) {
  const response = await httpClient.post<PlaySession[]>(
    "/play-sessions/from-reservation",
    {
      reservationId: Number(values.reservationId),
      machineIds: toMachineIds(values.machineIds),
    }
  );
  return response.data;
}

export async function endPlaySession(id: number) {
  const response = await httpClient.patch<PlaySession>(
    `/play-sessions/${id}/end`
  );
  return response.data;
}

export async function cancelPlaySession(id: number) {
  await httpClient.patch(`/play-sessions/${id}/cancel`);
}
