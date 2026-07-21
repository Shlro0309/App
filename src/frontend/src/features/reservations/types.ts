export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

export type ReservationMachine = {
  id: number;
  name: string;
  areaId: number;
  areaName: string;
  hourlyPrice: number;
  status: string;
};

export type Reservation = {
  id: number;
  reservationCode: string;
  customerId: number;
  userId: number;
  customerName: string;
  phoneNumber: string | null;
  reservedAt: string;
  expiresAt: string;
  deposit: number;
  status: ReservationStatus;
  machines: ReservationMachine[];
};

export type StationReservation = {
  reservationId: number;
  reservationCode: string;
  machineId: number;
  machineName: string;
  expiresAt: string;
  status: ReservationStatus;
};

export type ReservationFilters = {
  keyword: string;
  customerId: string;
  status: string;
  page: number;
  size: number;
};

export type AvailableMachineFilters = {
  keyword: string;
  areaId: string;
  page: number;
  size: number;
};

export type ReservationFormValues = {
  customerId: string;
  expiresAt: string;
  deposit: string;
  machineIds: number[];
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
