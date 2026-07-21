export type RealtimeEventType =
  | "MACHINE_STATUS_CHANGED"
  | "RESERVATION_CHANGED"
  | "PLAY_SESSION_CHANGED"
  | "FOOD_ORDER_CHANGED"
  | "PAYMENT_CHANGED";

export type RealtimeEvent = {
  type: RealtimeEventType;
  entityId: number | null;
  action: string;
  message: string;
  occurredAt: string;
};
