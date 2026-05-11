import { useRef, useEffect, useState } from "react";
import { type Announcement } from "@/types";
import { prioColor } from "@/lib/helpers";
import { Badge } from "@/components/Primitives";

const PRIORITY_ORDER = ["Critical", "High", "Normal"] as const;

function sortAnnouncements(anns: Announcement[]) {
  return [...anns].sort(
    (a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );
}

export default function AnnouncementBanner({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const pub = announcements.filter((a) => a.published);
  if (!pub.length) return null;

  const sorted = sortAnnouncements(pub);
  const top = sorted[0];
  const c = prioColor(top.priority);

  const tickerText = sorted
    .map((a) => `[${a.priority.toUpperCase()}] ${a.title} — ${a.content}`)
    .join("     ⬥     ");

  const textRef = useRef<HTMLSpanElement>(null);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (textRef.current) {
      const w = textRef.current.scrollWidth;
      setDuration(Math.max(12, w / 80));
    }
  }, [tickerText]);

  return (
    <div
      style={{
        background: c + "0c",
        borderBottom: "1px solid " + c + "33",
        padding: "5px 0",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        height: 28,
        position: "relative",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "0 10px",
          borderRight: "1px solid " + c + "33",
          zIndex: 2,
          background: c + "0c",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Badge label={top.priority} color={c} />
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          height: "100%",
        }}
      >
        <span
          ref={textRef}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: "#8aabb0",
            letterSpacing: 1,
            animation: `ticker ${duration}s linear infinite`,
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {tickerText}
        </span>
      </div>
    </div>
  );
}
