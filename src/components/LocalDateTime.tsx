"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getDeviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getServerTimeZone = () => "UTC";

export function LocalDateTime({ value, format = "full" }: { value: string; format?: "full" | "compact" | "date" }) {
  // Keep SSR and initial hydration identical, then use the device's timezone.
  const timeZone = useSyncExternalStore(
    subscribe,
    getDeviceTimeZone,
    getServerTimeZone
  );
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: format === "full" ? "long" : undefined,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: format === "date" ? undefined : "numeric",
    minute: format === "date" ? undefined : "2-digit",
    timeZone,
    timeZoneName: format === "date" ? undefined : "short",
  }).format(new Date(value));

  return <time dateTime={value}>{formatted}</time>;
}
