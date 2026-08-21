export type ReportBreakdown = {
  label: string;
  revenue: number;
  count: number;
};

export type ReportRevenuePoint = {
  date: string;
  revenue: number;
  paidInvoiceCount: number;
};

export type ReportMachineUsage = {
  machineId: number;
  machineName: string;
  areaName: string;
  sessionCount: number;
  totalMinutes: number;
  revenue: number;
};

export type ReportServiceSales = {
  serviceId: number;
  serviceName: string;
  serviceType: string | null;
  quantity: number;
  revenue: number;
};

export type ReportTopCustomer = {
  customerId: number;
  customerName: string | null;
  phoneNumber: string | null;
  paidInvoiceCount: number;
  revenue: number;
};

export type ReportOverview = {
  fromDate: string;
  toDate: string;
  generatedAt: string;
  totalRevenue: number;
  playSessionRevenue: number;
  serviceRevenue: number;
  averageInvoiceAmount: number;
  paidInvoiceCount: number;
  completedPlaySessionCount: number;
  completedOrderCount: number;
  totalPlayMinutes: number;
  revenueTrend: ReportRevenuePoint[];
  revenueByTransactionType: ReportBreakdown[];
  revenueByPaymentMethod: ReportBreakdown[];
  machineUsage: ReportMachineUsage[];
  serviceSales: ReportServiceSales[];
  topCustomers: ReportTopCustomer[];
};

export type ReportFilters = {
  fromDate: string;
  toDate: string;
};
