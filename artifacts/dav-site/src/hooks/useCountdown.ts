import { useState, useEffect } from "react";

function parseTarget(date: string, time?: string): Date | null {
  try {
    const timeStr = (time || "00:00").replace(/\s*UTC\s*/i, "").trim();
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(date + "T00:00:00Z");
    if (isNaN(d.getTime())) return null;
    d.setUTCHours(h || 0, m || 0, 0, 0);
    return d;
  } catch {
    return null;
  }
}

function fmt(ms: number): string {
  if (ms <= 0) return "COMMENCING NOW";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}D ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function useCountdown(date: string, time?: string): string {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const target = parseTarget(date, time);
    if (!target) { setDisplay(""); return; }

    const tick = () => setDisplay(fmt(target.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date, time]);

  return display;
}
