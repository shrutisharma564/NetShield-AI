import { useEffect, useRef, useState } from "react";

export interface LiveTrafficEvent {
  source_ip: string;
  destination_ip: string;
  protocol: string;
  packet_size: number;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  origin_country: string;
  origin_lat: number;
  origin_lon: number;
  prediction: string;
  risk_score: number;
  attack_type: string;
  recommended_action: string;
}

export interface LiveMessage {
  type: "traffic";
  traffic: LiveTrafficEvent;
  threat: { id: number; attack_type: string; risk_score: number } | null;
  alert: { id: number; priority: string; message: string; status: string } | null;
}

const WS_BASE = "ws://localhost:8000";
const MAX_FEED_LENGTH = 30;

/**
 * Connects to the backend's /ws/traffic feed and keeps a rolling window of
 * recent simulated packets. Reconnects automatically with backoff if the
 * socket drops (e.g. backend restarted).
 */
export function useTrafficSocket() {
  const [feed, setFeed] = useState<LiveTrafficEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<LiveMessage | null>(null);
  const retryDelay = useRef(1000);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      const token = localStorage.getItem("netshield_token");
      if (!token) return;

      socket = new WebSocket(`${WS_BASE}/ws/traffic?token=${token}`);

      socket.onopen = () => {
        setConnected(true);
        retryDelay.current = 1000;
      };

      socket.onmessage = (event) => {
        try {
          const msg: LiveMessage = JSON.parse(event.data);
          setLastMessage(msg);
          setFeed((prev) => [msg.traffic, ...prev].slice(0, MAX_FEED_LENGTH));
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          retryTimeout = setTimeout(connect, retryDelay.current);
          retryDelay.current = Math.min(retryDelay.current * 1.5, 15000);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      socket?.close();
    };
  }, []);

  return { feed, connected, lastMessage };
}
