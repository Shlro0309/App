import { getFoodOrders, getServiceItems } from "@/features/food-service/foodServiceApi";
import type { FoodOrder, ServiceItem } from "@/features/food-service/types";
import { getPayments } from "@/features/payments/paymentApi";
import type { Payment } from "@/features/payments/types";
import { getPlaySessions } from "@/features/play-sessions/playSessionApi";
import type { PlaySession } from "@/features/play-sessions/types";
import {
  createReservation,
  getAvailableReservationMachines,
  getReservations,
} from "@/features/reservations/reservationApi";
import type {
  Reservation,
  ReservationMachine,
} from "@/features/reservations/types";

export async function getCustomerActiveSession(customerId: number) {
  const page = await getPlaySessions({
    keyword: "",
    customerId: String(customerId),
    machineId: "",
    status: "ACTIVE",
    page: 0,
    size: 1,
  });

  return page.content[0] ?? null;
}

export async function getCustomerFoodOrders(
  customerId: number,
  playSessionId?: number | null
) {
  const page = await getFoodOrders({
    keyword: "",
    customerId: String(customerId),
    playSessionId: playSessionId ? String(playSessionId) : "",
    status: "",
    page: 0,
    size: 5,
  });

  return page.content;
}

export async function getCustomerPayments(customerId: number) {
  const page = await getPayments({
    keyword: "",
    customerId: String(customerId),
    playSessionId: "",
    orderId: "",
    status: "",
    page: 0,
    size: 6,
  });

  return page.content;
}

export async function getCustomerServices() {
  const page = await getServiceItems({
    keyword: "",
    serviceType: "",
    status: "ACTIVE",
    page: 0,
    size: 20,
  });

  return page.content;
}

export async function getCustomerAvailableMachines(keyword = "") {
  const page = await getAvailableReservationMachines({
    keyword,
    areaId: "",
    page: 0,
    size: 24,
  });

  return page.content;
}

export async function getCustomerReservations(customerId: number) {
  const page = await getReservations({
    keyword: "",
    customerId: String(customerId),
    status: "",
    page: 0,
    size: 8,
  });

  return page.content;
}

export async function createCustomerReservation(values: {
  expiresAt: string;
  deposit: string;
  machineIds: number[];
}) {
  return createReservation({
    customerId: "",
    expiresAt: values.expiresAt,
    deposit: values.deposit,
    machineIds: values.machineIds,
  });
}

export type CustomerPanelData = {
  activeSession: PlaySession | null;
  orders: FoodOrder[];
  payments: Payment[];
  services: ServiceItem[];
};

export type CustomerPrebookData = {
  machines: ReservationMachine[];
  reservations: Reservation[];
};
