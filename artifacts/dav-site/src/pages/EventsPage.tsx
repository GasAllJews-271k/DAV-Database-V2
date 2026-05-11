import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type GameEvent } from "@/types";
import { evStatColor, evTypeColor, fmtDate } from "@/lib/helpers";
import { Badge, CARD, btn, PageWrap, SecHeader } from "@/components/Primitives";
import { useCountdown } from "@/hooks/useCountdown";

function CountdownBadge({ date, time }: { date: string; time?: string }) {
  const display = useCountdown(date, time);
  if (!display) return null;
  const isDone = display === "COMMENCING NOW";
  return (
    <div style={{
      fontFamily: "'Courier New',monospace",
      fontSize: 11,
      color: isDone ? "#00ff88" : "#c47a1e",
      border: "1px solid " + (isDone ? "#00ff8844" : "#c47a1e44"),
      padding: "4px 10px",
      letterSpacing: 2,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    }}>
      <span style={{ fontSize: 8, opacity: 0.7 }}>T-MINUS</span>
      {display}
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap =>
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as GameEvent)).filter(e => e.published))
    );
  }, []);

  const types = ["All", "Training", "Official", "Research", "Emergency"];
  const filtered = filter === "All" ? events : events.filter(e => e.type === filter);

  return (
    <PageWrap>
      <SecHeader tag="Operations Board" title="ACTIVE EVENTS" sub="// Live — published events appear here instantly" />
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ ...btn(filter === t ? "#00ff88" : "#3a5a6a"), padding: "5px 12px", fontSize: 9 }}>{t}</button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ color: "#1a3a4a", fontFamily: "'Courier New',monospace", textAlign: "center", padding: 40, letterSpacing: 3 }}>NO PUBLISHED EVENTS</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(ev => (
          <div key={ev.id} style={{ ...CARD, borderLeft: "2px solid " + evStatColor(ev.status) }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ color: "#1a3a4a", fontSize: 8, letterSpacing: 3, fontFamily: "'Courier New',monospace", marginBottom: 4 }}>{fmtDate(ev.date)} — {ev.time} UTC</div>
                <div style={{ color: "#b0c4d4", fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Courier New',monospace" }}>{ev.title}</div>
                {ev.status === "Upcoming" && <CountdownBadge date={ev.date} time={ev.time} />}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                <Badge label={ev.type || ""} color={evTypeColor(ev.type)} />
                <Badge label={ev.status || ""} color={evStatColor(ev.status)} />
              </div>
            </div>
            <div style={{ color: "#2a4a5a", fontSize: 12, lineHeight: 1.7, marginBottom: 8, fontFamily: "'Courier New',monospace" }}>{ev.desc}</div>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: "#1a3a4a" }}>HOST: <span style={{ color: "#3a5a6a" }}>{ev.host}</span></div>
          </div>
        ))}
      </div>
    </PageWrap>
  );
}
