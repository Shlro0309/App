export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export type Payment = {
  id: number;
  customerId: number;
  userId: number;
  customerName: string;
  phoneNumber: string | null;
  employeeId: number | null;
  employeeName: string | null;
  playSessionId: number | null;
  machineId: number | null;
  machineName: string | null;
  orderId: number | null;
  transactionType: string;
  playSessionAmount: number;
  orderAmount: number;
  amount: number;
  paymentMethod: string | null;
  status: PaymentStatus;
  transactionAt: string;
};

export type PaymentFilters = {
  keyword: string;
  customerId: string;
  playSessionId: string;
  orderId: string;
  status: string;
  page: number;
  size: number;
};

export type CustomerTopUpValues = {
  amount: string;
  paymentMethod: string;
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
