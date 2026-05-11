import { useState, useEffect, useRef } from "react";
import { type Session, NAV_LINKS, RANK_META } from "@/types";
import { fmtTS } from "@/lib/helpers";

interface TerminalProps {
  session: Session | null;
  setPage: (p: string) => void;
  onClose: () => void;
}

type Line = { text: string; color?: string };

const PAGES = [...NAV_LINKS, "Portal", "Login", "Roster", "Events"];

const BOOT = [
  "D.A.V. COMMAND TERMINAL v4.7 — INITIALIZING...",
  "SECURE SHELL ESTABLISHED",
  "TYPE 'HELP' FOR AVAILABLE COMMANDS",
  "─────────────────────────────────────────────",
];

function process(
  input: string,
  session: Session | null,
  setPage: (p: string) => void,
  close: () => void,
): Line[] {
  const parts = input.trim().toLowerCase().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return [
        { text: "AVAILABLE COMMANDS:", color: "#00ff88" },
        { text: "  whoami          — display current session info" },
        { text: "  status          — system status report" },
        { text: "  ls              — list available sections" },
        { text: "  goto [section]  — navigate to a section" },
        { text: "  time            — current UTC timestamp" },
        { text: "  ping            — check system latency" },
        { text: "  classified      — attempt classified access" },
        { text: "  sudo [cmd]      — attempt escalated execution" },
        { text: "  clear           — clear terminal output" },
        { text: "  exit            — close terminal" },
      ];

    case "whoami":
      if (!session)
        return [{ text: "NO ACTIVE SESSION — UNAUTHENTICATED TERMINAL", color: "#8b1a1a" }];
      return [
        { text: "─── SESSION DATA ──────────────────────────────", color: "#1a3a4a" },
        { text: `  UID:        ${session.uid}`, color: "#3a5a6a" },
        { text: `  CALLSIGN:   ${session.username || session.email}`, color: "#8aabb0" },
        { text: `  EMAIL:      ${session.email}`, color: "#3a5a6a" },
        { text: `  CLEARANCE:  CL-${session.level} — ${RANK_META[session.level]?.label?.toUpperCase() || "UNKNOWN"}`, color: RANK_META[session.level]?.color || "#00ff88" },
        { text: "───────────────────────────────────────────────", color: "#1a3a4a" },
      ];

    case "status":
      return [
        { text: "─── SYSTEM STATUS ─────────────────────────────", color: "#1a3a4a" },
        { text: "  FIREBASE DB      [ ONLINE ]", color: "#00ff88" },
        { text: "  AUTH SERVICE     [ ONLINE ]", color: "#00ff88" },
        { text: "  API SERVER       [ ONLINE ]", color: "#00ff88" },
        { text: "  DISCORD GATEWAY  [ ONLINE ]", color: "#00ff88" },
        { text: "  ENCRYPTION       [ AES-256 ACTIVE ]", color: "#c47a1e" },
        { text: `  UPTIME           [ ${Math.floor(performance.now() / 1000)}s this session ]`, color: "#3a5a6a" },
        { text: "───────────────────────────────────────────────", color: "#1a3a4a" },
      ];

    case "ls":
      return [
        { text: "AVAILABLE SECTIONS:", color: "#00ff88" },
        ...PAGES.map((p) => ({ text: `  ${p.toUpperCase()}`, color: "#3a5a6a" })),
      ];

    case "goto": {
      const target = args[0];
      if (!target) return [{ text: "USAGE: goto [section]", color: "#c47a1e" }];
      const match = PAGES.find((p) => p.toLowerCase() === target.toLowerCase());
      if (!match) return [{ text: `UNKNOWN SECTION: ${target.toUpperCase()}`, color: "#8b1a1a" }];
      if (!session && ["Portal", "Roster", "OpLog"].includes(match))
        return [{ text: "ACCESS DENIED — AUTHENTICATION REQUIRED", color: "#8b1a1a" }];
      setPage(match);
      close();
      return [{ text: `NAVIGATING TO ${match.toUpperCase()}...`, color: "#00ff88" }];
    }

    case "time":
      return [{ text: fmtTS(), color: "#8aabb0" }];

    case "ping": {
      const t = Math.floor(Math.random() * 12) + 2;
      return [
        { text: `PING DAV-CENTRAL.db — ${t}ms`, color: "#00ff88" },
        { text: "PONG — CONNECTION SECURE", color: "#2a6b3c" },
      ];
    }

    case "classified":
      return [
        { text: "ACCESSING DIRECTIVE OMEGA FILES...", color: "#c47a1e" },
        { text: "IDENTITY SCAN IN PROGRESS...", color: "#c47a1e" },
        { text: "██████████████████████████████████", color: "#8b1a1a" },
        { text: "ACCESS DENIED — CLEARANCE INSUFFICIENT", color: "#8b1a1a" },
        { text: "THIS ATTEMPT HAS BEEN LOGGED.", color: "#8b1a1a" },
      ];

    case "sudo":
      return [
        { text: `[sudo] password for ${session?.username || "operative"}: `, color: "#c47a1e" },
        { text: "PERMISSION DENIED — NICE TRY, OPERATIVE.", color: "#8b1a1a" },
      ];

    case "clear":
      return [{ text: "__CLEAR__" }];

    case "exit":
    case "close":
    case "q":
      close();
      return [];

    case "":
      return [];

    default:
      return [
        { text: `COMMAND NOT FOUND: ${cmd}`, color: "#8b1a1a" },
        { text: "TYPE 'HELP' FOR AVAILABLE COMMANDS", color: "#1a3a4a" },
      ];
  }
}

export default function Terminal({ session, setPage, onClose }: TerminalProps) {
  const [lines, setLines] = useState<Line[]>(BOOT.map((t) => ({ text: t, color: "#1a3a4a" })));
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const submit = () => {
    const cmd = input.trim();
    const result = process(cmd, session, setPage, onClose);
    if (result.length === 1 && result[0].text === "__CLEAR__") {
      setLines(BOOT.map((t) => ({ text: t, color: "#1a3a4a" })));
    } else {
      setLines((prev) => [
        ...prev,
        { text: `> ${cmd}`, color: "#00ff88" },
        ...result,
      ]);
    }
    if (cmd) {
      setHistory((h) => [cmd, ...h.slice(0, 49)]);
      setHistIdx(-1);
    }
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { submit(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] || "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx] || "");
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "#000000ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 720, height: "70vh", background: "#050709", border: "1px solid #00ff8833", display: "flex", flexDirection: "column", boxShadow: "0 0 40px #00ff8808" }}>
        <div style={{ background: "#040608", borderBottom: "1px solid #0e1a22", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: "#1a3a4a", letterSpacing: 3 }}>
            D.A.V. COMMAND TERMINAL — PRESS ESC OR TYPE 'EXIT' TO CLOSE
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b1a1a", fontFamily: "'Courier New',monospace", fontSize: 12, cursor: "pointer", letterSpacing: 2 }}>✕ CLOSE</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px", fontFamily: "'Courier New',monospace", fontSize: 11, lineHeight: 1.8 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.color || "#3a5a6a", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{l.text}</div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: "1px solid #0e1a22", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#00ff88", fontFamily: "'Courier New',monospace", fontSize: 11, flexShrink: 0 }}>
            {session ? `${session.username || "operative"}@dav` : "guest@dav"}:~$
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#c8d6e5", fontFamily: "'Courier New',monospace", fontSize: 11, caretColor: "#00ff88" }}
            spellCheck={false}
            autoComplete="off"
          />
          <span style={{ color: "#00ff88", animation: "blink 1s step-end infinite", fontSize: 14 }}>█</span>
        </div>
      </div>
    </div>
  );
}
