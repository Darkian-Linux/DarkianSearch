"use client";

import { useEffect, useState } from "react";

export function SystemClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="h-8 w-24" />;

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-start leading-tight tabular-nums">
      <span className="text-sm font-medium tracking-wide">{time}</span>
      <span className="text-muted-foreground text-[11px]">{date}</span>
    </div>
  );
}
