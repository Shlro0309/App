export type ServiceItemStatus = "INACTIVE" | "ACTIVE";

export type FoodOrderStatus =
  | "PENDING"
  | "PREPARING"
  | "COMPLETED"
  | "CANCELLED";

export type ServiceItem = {
  id: number;
  name: string;
  price: number;
  serviceType: string | null;
  imageUrl: string | null;
  stockQuantity: number;
  status: ServiceItemStatus;
};

export type OrderDetail = {
  id: number;
  serviceId: number;
  serviceName: string;
  serviceType: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type FoodOrder = {
  id: number;
  customerId: number;
  userId: number;
  customerName: string;
  phoneNumber: string | null;
  playSessionId: number | null;
  machineId: number | null;
  machineName: string | null;
  employeeId: number | null;
  employeeName: string | null;
  orderedAt: string;
  totalAmount: number;
  status: FoodOrderStatus;
  items: OrderDetail[];
};

export type ServiceItemFilters = {
  keyword: string;
  serviceType: string;
  status: string;
  page: number;
  size: number;
};

export type FoodOrderFilters = {
  keyword: string;
  customerId: string;
  playSessionId: string;
  status: string;
  page: number;
  size: number;
};

export type ServiceItemFormValues = {
  name: string;
  price: string;
  serviceType: string;
  imageUrl: string;
  stockQuantity: string;
  status: ServiceItemStatus;
};

export type FoodOrderFormValues = {
  customerId: string;
  playSessionId: string;
  paymentMethod: string;
  items: Array<{
    serviceId: string;
    quantity: string;
  }>;
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
