export type AccountStatus = "ACTIVE" | "LOCKED";

export type UserRole = "ADMIN" | "EMPLOYEE" | "CUSTOMER";

export type User = {
  id: number;
  username: string;
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  role: UserRole;
  status: AccountStatus;
  customerId: number | null;
  employeeId: number | null;
  createdAt: string;
};

export type Role = {
  id: number;
  name: UserRole;
  description: string | null;
};

export type UserFilters = {
  keyword: string;
  role: string;
  status: string;
  page: number;
  size: number;
};

export type UserFormValues = {
  username: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
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
