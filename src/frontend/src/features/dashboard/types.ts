export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardRevenuePoint = {
  date: string;
  revenue: number;
  paidInvoiceCount: number;
};

export type DashboardActiveSession = {
  id: number;
  customerId: number;
  customerName: string;
  machineId: number;
  machineName: string;
  areaName: string;
  startedAt: string;
  durationMinutes: number;
};

export type DashboardRecentPayment = {
  id: number;
  customerId: number;
  customerName: string;
  transactionType: string;
  amount: number;
  paymentMethod: string | null;
  transactionAt: string;
};

export type DashboardOverview = {
  generatedAt: string;
  todayRevenue: number;
  weekRevenue: number;
  paidInvoicesToday: number;
  pendingInvoices: number;
  activePlaySessions: number;
  completedPlaySessionsToday: number;
  todayReservations: number;
  confirmedReservationsToday: number;
  pendingOrders: number;
  completedOrdersToday: number;
  totalMachines: number;
  availableMachines: number;
  playingMachines: number;
  maintenanceMachines: number;
  activeServices: number;
  lowStockServices: number;
  machineStatuses: DashboardStatusCount[];
  reservationStatuses: DashboardStatusCount[];
  playSessionStatuses: DashboardStatusCount[];
  orderStatuses: DashboardStatusCount[];
  invoiceStatuses: DashboardStatusCount[];
  revenueTrend: DashboardRevenuePoint[];
  activeSessions: DashboardActiveSession[];
  recentPayments: DashboardRecentPayment[];
};
