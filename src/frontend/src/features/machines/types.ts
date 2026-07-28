export type MachineStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PLAYING"
  | "MAINTENANCE";

export type Machine = {
  id: number;
  name: string;
  areaId: number;
  areaName: string;
  cpu: string | null;
  gpu: string | null;
  ram: number | null;
  fps: number | null;
  resolution: string | null;
  hourlyPrice: number;
  status: MachineStatus;
  addedAt: string;
};

export type Area = {
  id: number;
  name: string;
  description: string | null;
  machineCount: number;
};

export type AreaFormValues = {
  name: string;
  description: string;
};

export type MachineFilters = {
  keyword: string;
  areaId: string;
  status: string;
  page: number;
  size: number;
};

export type MachineFormValues = {
  name: string;
  areaId: string;
  cpu: string;
  gpu: string;
  ram: string;
  fps: string;
  resolution: string;
  hourlyPrice: string;
  status: MachineStatus;
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
