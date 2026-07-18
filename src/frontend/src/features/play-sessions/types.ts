export type PlaySessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type PlaySession = {
  id: number;
  customerId: number;
  userId: number;
  customerName: string;
  phoneNumber: string | null;
  machineId: number;
  machineName: string;
  areaId: number;
  areaName: string;
  hourlyPrice: number;
  startedAt: string;
  endedAt: string | null;
  totalHourlyAmount: number;
  durationMinutes: number;
  status: PlaySessionStatus;
};

export type PlaySessionFilters = {
  keyword: string;
  customerId: string;
  machineId: string;
  status: string;
  page: number;
  size: number;
};

export type DirectStartValues = {
  customerId: string;
  machineId: string;
};

export type ReservationStartValues = {
  reservationId: string;
  machineIds: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};
