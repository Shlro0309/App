import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { createRealtimeClient } from "./realtimeClient";
import type { RealtimeEvent, RealtimeEventType } from "./types";

export function useRealtimeEvents(
  eventTypes: RealtimeEventType[],
  onEvent: (event: RealtimeEvent) => void
) {
  const status = useAuthStore((state) => state.status);
  const onEventRef = useRef(onEvent);
  const eventTypesRef = useRef(eventTypes);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    eventTypesRef.current = eventTypes;
  }, [eventTypes]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const client = createRealtimeClient((event) => {
      if (eventTypesRef.current.includes(event.type)) {
        onEventRef.current(event);
      }
    });
    client.activate();

    return () => {
      void client.deactivate();
    };
  }, [status]);
}
