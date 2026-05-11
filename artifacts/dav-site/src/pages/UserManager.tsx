import { useState, useEffect } from "react";
import { collection, onSnapshot, updateDoc, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, FIREBASE_API_KEY } from "@/lib/firebase";
import { type UserProfile, RANK_META } from "@/types";
import { ClearancePill, CARD, INP, LBL, btn, PageWrap, SecHeader, Modal } from "@/components/Primitives";

type UserForm = { email: string; password: string; username: string; level: number };
const blankForm: UserForm = { email: "", password: "", username: "", level: 1 };

export default function UserManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [form, setForm] = useState<UserForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pendingDelete, setPendingDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "users"), snap =>
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)))
    );
  }, []);

  const createUser = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.username.trim()) return;
    setSaving(true); setMsg("");
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, returnSecureToken: true }),
      });
      const data = await res.json();
      if (data.error) {
        const code: string = data.error.message || "";
        if (code.includes("EMAIL_EXISTS")) setMsg("ERROR: EMAIL ALREADY REGISTERED");
        else if (code.includes("INVALID_EMAIL")) setMsg("ERROR: INVALID EMAIL FORMAT");
        else if (code.includes("WEAK_PASSWORD")) setMsg("ERROR: PASSWORD TOO WEAK — MIN 6 CHARACTERS");
        else setMsg("ERROR: ACCOUNT CREATION FAILED");
        setSaving(false);
        return;
      }
      await setDoc(doc(db, "users", data.localId), {
        email: form.email,
        username: form.username,
        level: Number(form.level),
        rank: RANK_META[Number(form.level)]?.label || "Recruit",
        createdAt: serverTimestamp(),
      });
      setMsg("USER CREATED: " + form.username + " // CL-" + form.level);
      setForm(blankForm);
    } catch {
      setMsg("ERROR: ACCOUNT CREATION FAILED — CHECK CONNECTION");
    }
    setSaving(false);
  };

  const updateLevel = async (uid: string, level: number) => {
    await updateDoc(doc(db, "users", uid), { level, rank: RANK_META[level]?.label || "Recruit" });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", pendingDelete.id));
      setMsg("ACCOUNT REVOKED: " + (pendingDelete.username || pendingDelete.email));
    } catch {
      setMsg("ERROR: FAILED TO REVOKE ACCOUNT — CHECK CONNECTION");
    }
    setPendingDelete(null);
    setDeleting(false);
  };

  return (
    <PageWrap>
      {pendingDelete && (
        <Modal
          title="// REVOKE PERSONNEL ACCESS"
          body={`Remove ${pendingDelete.username || pendingDelete.email} (${pendingDelete.email}) from the system? Their clearance will be revoked and they will no longer be able to authenticate.`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      <SecHeader tag="Admin — Users" title="USER MANAGER" sub="// Create and revoke personnel accounts — CL-5+" clearance={5} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        <div style={CARD}>
          <div style={{ color: "#1a3a4a", fontSize: 8, letterSpacing: 3, fontFamily: "'Courier New',monospace", marginBottom: 14 }}>// CREATE NEW PERSONNEL ACCOUNT</div>
          <div style={{ marginBottom: 10 }}>
            <label style={LBL}>Username / Callsign</label>
            <input style={INP} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. OPERATIVE-007" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LBL}>Email Address</label>
            <input style={INP} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Enter email address" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={LBL}>Temporary Password</label>
            <input style={INP} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LBL}>Clearance Level</label>
            <select style={INP} value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5, 6].map(l => (
                <option key={l} value={l}>CL-{l} — {RANK_META[l].label}</option>
              ))}
            </select>
          </div>
          {msg && (
            <div style={{ background: msg.startsWith("ERROR") ? "#0a0405" : "#040a05", border: "1px solid " + (msg.startsWith("ERROR") ? "#8b1a1a" : "#00ff88"), padding: "8px 12px", color: msg.startsWith("ERROR") ? "#8b1a1a" : "#00ff88", fontSize: 10, marginBottom: 12, fontFamily: "'Courier New',monospace" }}>
              {msg}
            </div>
          )}
          <button onClick={createUser} disabled={saving || deleting} style={{ ...btn("#00ff88"), width: "100%", padding: 10 }}>
            {saving ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </div>

        <div>
          <div style={{ color: "#1a3a4a", fontSize: 8, letterSpacing: 3, fontFamily: "'Courier New',monospace", marginBottom: 12 }}>// REGISTERED PERSONNEL ({users.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 580, overflowY: "auto" }}>
            {users.map(u => {
              const m = RANK_META[u.level] || RANK_META[1];
              return (
                <div key={u.id} style={{ ...CARD, borderLeft: "2px solid " + m.color + "44" }}>
                  <div style={{ color: "#b0c4d4", fontWeight: 700, fontSize: 11, fontFamily: "'Courier New',monospace", marginBottom: 4 }}>{u.username || u.email}</div>
                  <div style={{ color: "#2a4a5a", fontSize: 10, fontFamily: "'Courier New',monospace", marginBottom: 8 }}>{u.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <ClearancePill level={u.level || 1} />
                    <select style={{ ...INP, width: "auto", padding: "4px 8px", fontSize: 10 }} value={u.level || 1} onChange={e => updateLevel(u.id, Number(e.target.value))}>
                      {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>CL-{l}</option>)}
                    </select>
                    <button
                      onClick={() => setPendingDelete(u)}
                      style={{ ...btn("#8b1a1a"), padding: "4px 10px", fontSize: 9, marginLeft: "auto" }}
                    >
                      REVOKE
                    </button>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div style={{ color: "#1a3a4a", fontFamily: "'Courier New',monospace", fontSize: 10, padding: 20, textAlign: "center" }}>NO USERS IN DATABASE YET</div>
            )}
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
