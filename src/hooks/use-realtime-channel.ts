"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "offline";

/**
 * Opens a Supabase Realtime channel for as long as the component is mounted.
 *
 * @param topic       Readable channel name, e.g. "board:123"
 * @param configure   Registers listeners. Must only use refs and stable values (queryClient, ids).
 * @param onReconnect Runs when the connection comes back after a drop, to refetch missed changes.
 */
export function useRealtimeChannel(
  topic: string,
  configure: (channel: RealtimeChannel) => void,
  onReconnect?: () => void,
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  // Keep the latest callbacks without re-subscribing on every render
  const configureRef = useRef(configure);
  const onReconnectRef = useRef(onReconnect);
  useEffect(() => {
    configureRef.current = configure;
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    let connectedBefore = false;

    const start = async () => {
      // Make sure the socket uses the user's JWT, so Postgres RLS decides which rows we receive
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      // Unique name: React Strict Mode mounts effects twice in development
      channel = supabase.channel(
        `${topic}:${Math.random().toString(36).slice(2)}`,
      );
      configureRef.current(channel);

      channel.subscribe((state) => {
        const s = String(state);
        if (s === "SUBSCRIBED") {
          setStatus("live");
          // Came back after a drop? Refetch anything we missed while offline.
          if (connectedBefore) onReconnectRef.current?.();
          connectedBefore = true;
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("offline"); // supabase-js retries automatically
        }
      });
    };

    void start();

    // Leaving the page → close the channel (no memory leaks, no ghost listeners)
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [topic]);

  return status;
}
