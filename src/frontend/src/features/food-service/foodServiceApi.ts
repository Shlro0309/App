import { httpClient } from "@/api/httpClient";
import type {
  FoodOrder,
  FoodOrderFilters,
  FoodOrderFormValues,
  FoodOrderStatus,
  PageResponse,
  ServiceItem,
  ServiceItemFilters,
  ServiceItemFormValues,
  ServiceItemStatus,
} from "./types";

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : undefined;
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toServiceItemPayload(values: ServiceItemFormValues) {
  return {
    name: values.name.trim(),
    price: Number(values.price),
    serviceType: nullableText(values.serviceType),
    imageUrl: nullableText(values.imageUrl),
    stockQuantity: Number(values.stockQuantity),
    status: values.status,
  };
}

function toOrderPayload(values: FoodOrderFormValues) {
  return {
    customerId: optionalNumber(values.customerId),
    playSessionId: optionalNumber(values.playSessionId),
    items: values.items
      .filter((item) => item.serviceId.trim() && item.quantity.trim())
      .map((item) => ({
        serviceId: Number(item.serviceId),
        quantity: Number(item.quantity),
      })),
  };
}

export async function getServiceItems(filters: ServiceItemFilters) {
  const response = await httpClient.get<PageResponse<ServiceItem>>(
    "/food-services",
    {
      params: {
        keyword: filters.keyword || undefined,
        serviceType: filters.serviceType || undefined,
        status: filters.status || undefined,
        page: filters.page,
        size: filters.size,
        sort: "id,asc",
      },
    }
  );

  return response.data;
}

export async function getServiceStatuses() {
  const response = await httpClient.get<ServiceItemStatus[]>(
    "/food-services/statuses"
  );
  return response.data;
}

export async function createServiceItem(values: ServiceItemFormValues) {
  const response = await httpClient.post<ServiceItem>(
    "/food-services",
    toServiceItemPayload(values)
  );
  return response.data;
}

export async function updateServiceItem(
  id: number,
  values: ServiceItemFormValues
) {
  const payload = toServiceItemPayload(values);
  const response = await httpClient.put<ServiceItem>(`/food-services/${id}`, {
    name: payload.name,
    price: payload.price,
    serviceType: payload.serviceType,
    imageUrl: payload.imageUrl,
    stockQuantity: payload.stockQuantity,
  });
  return response.data;
}

export async function updateServiceItemStatus(
  id: number,
  status: ServiceItemStatus
) {
  const response = await httpClient.patch<ServiceItem>(
    `/food-services/${id}/status`,
    { status }
  );
  return response.data;
}

export async function deactivateServiceItem(id: number) {
  await httpClient.delete(`/food-services/${id}`);
}

export async function getFoodOrders(filters: FoodOrderFilters) {
  const response = await httpClient.get<PageResponse<FoodOrder>>(
    "/food-orders",
    {
      params: {
        keyword: filters.keyword || undefined,
        customerId: filters.customerId || undefined,
        playSessionId: filters.playSessionId || undefined,
        status: filters.status || undefined,
        page: filters.page,
        size: filters.size,
        sort: "orderedAt,desc",
      },
    }
  );

  return response.data;
}

export async function getFoodOrderStatuses() {
  const response = await httpClient.get<FoodOrderStatus[]>(
    "/food-orders/statuses"
  );
  return response.data;
}

export async function createFoodOrder(values: FoodOrderFormValues) {
  const response = await httpClient.post<FoodOrder>(
    "/food-orders",
    toOrderPayload(values)
  );
  return response.data;
}

export async function updateFoodOrderStatus(
  id: number,
  status: FoodOrderStatus
) {
  const response = await httpClient.patch<FoodOrder>(
    `/food-orders/${id}/status`,
    { status }
  );
  return response.data;
}

export async function cancelFoodOrder(id: number) {
  await httpClient.patch(`/food-orders/${id}/cancel`);
}
