import { httpClient } from "@/api/httpClient";
import type {
  PageResponse,
  Payment,
  PaymentFilters,
  PaymentStatus,
  CustomerTopUpValues,
} from "./types";

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function getPayments(filters: PaymentFilters) {
  const response = await httpClient.get<PageResponse<Payment>>("/payments", {
    params: {
      keyword: filters.keyword || undefined,
      customerId: filters.customerId || undefined,
      playSessionId: filters.playSessionId || undefined,
      orderId: filters.orderId || undefined,
      status: filters.status || undefined,
      page: filters.page,
      size: filters.size,
      sort: "transactionAt,desc",
    },
  });

  return response.data;
}

export async function getPaymentStatuses() {
  const response = await httpClient.get<PaymentStatus[]>("/payments/statuses");
  return response.data;
}

export async function getPaymentMethods() {
  const response = await httpClient.get<string[]>("/payments/methods");
  return response.data;
}

export async function topUpCustomerBalance(values: CustomerTopUpValues) {
  const response = await httpClient.post<Payment>("/payments/top-up", {
    amount: Number(values.amount),
    paymentMethod: optionalText(values.paymentMethod),
  });
  return response.data;
}

export async function payPayment(id: number, paymentMethod: string) {
  const response = await httpClient.patch<Payment>(`/payments/${id}/pay`, {
    paymentMethod: optionalText(paymentMethod),
  });
  return response.data;
}

export async function updatePaymentStatus(
  id: number,
  status: PaymentStatus,
  paymentMethod: string
) {
  const response = await httpClient.patch<Payment>(`/payments/${id}/status`, {
    status,
    paymentMethod: status === "PAID" ? optionalText(paymentMethod) : undefined,
  });
  return response.data;
}

export async function cancelPayment(id: number) {
  await httpClient.patch(`/payments/${id}/cancel`);
}
