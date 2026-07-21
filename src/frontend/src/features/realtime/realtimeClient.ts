import { Client, type IMessage } from "@stomp/stompjs";
import { getAccessToken } from "@/features/auth/tokenStorage";
import type { RealtimeEvent } from "./types";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

function realtimeURL() {
  const base = apiBaseURL.startsWith("http")
    ? new URL(apiBaseURL)
    : new URL(apiBaseURL, window.location.origin);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = `${base.pathname.replace(/\/$/, "")}/ws`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

export function createRealtimeClient(onEvent: (event: RealtimeEvent) => void) {
  const client = new Client({
    brokerURL: realtimeURL(),
    connectHeaders: getAccessToken()
      ? { Authorization: `Bearer ${getAccessToken()}` }
      : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => undefined,
  });

  client.onConnect = () => {
    client.subscribe("/topic/realtime", (message: IMessage) => {
      try {
        onEvent(JSON.parse(message.body) as RealtimeEvent);
      } catch {
        // Ignore malformed realtime payloads and keep the socket alive.
      }
    });
  };

  return client;
}
