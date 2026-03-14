import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// -- CONFIG --------------------------------------------------------------------
// Replace this with your Railway backend URL after deploying
const API_BASE = process.env.REACT_APP_API_URL || "https://your-railway-app.up.railway.app";

const useApi = (secret) => {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };
  const get = (path) => fetch(`${API_BASE}${path}`, { headers }).then((r) => r.json());
  const post = (path, body) =>
    fetch(`${API_BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) }).then((r) => r.json());
  return { get, post };
};

// -- ICONS ---------------------------------------------------------------------
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  groups: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  relay: "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3",
  broadcast: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.1 4H3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L4.09 11a16 16 0 006.9 6.9l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  media: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  digest: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  send: "M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  loader: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
};

// -- LOGIN SCREEN --------------------------------------------------------------
function LoginScreen({ onLogin }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!secret) return;
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        localStorage.setItem("agent_secret", secret);
        onLogin(secret);
      } else {
        setError("Wrong password. Check your DASHBOARD_SECRET in Railway.");
      }
    } catch {
      setError("Cannot connect to agent. Make sure Railway is deployed.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: "#12121a", border: "1px solid #1e1e2e",
          borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 400,
          textAlign: "center"
        }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>Robot </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>
          Telegram AI Agent
        </h1>
        <p style={{ color: "#555", fontSize: 14, margin: "0 0 32px", fontFamily: "'DM Mono', monospace" }}>
          by Brandash Media
        </p>
        <input
          type="password"
          placeholder="Enter your dashboard password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", padding: "14px 16px", background: "#0a0a0f",
            border: "1px solid #2a2a3a", borderRadius: 10, color: "#fff",
            fontSize: 15, outline: "none", boxSizing: "border-box",
            fontFamily: "'DM Mono', monospace", marginBottom: 12
          }}
        />
        {error && <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        <button onClick={handleLogin} style={{
          width: "100%", padding: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", borderRadius: 10, color: "#fff", fontSize: 16,
          fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif"
        }}>
          Enter Dashboard ->
        </button>
      </motion.div>
    </div>
  );
}

// -- STAT CARD -----------------------------------------------------------------
function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "#12121a", border: `1px solid ${accent}33`,
      borderRadius: 14, padding: "20px 24px", flex: 1, minWidth: 130
    }}>
      <div style={{ color: accent, fontSize: 28, fontWeight: 800 }}>{value ?? "-"}</div>
      <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// -- TOGGLE --------------------------------------------------------------------
function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12,
      background: value ? "#6366f1" : "#2a2a3a",
      cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 22 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s"
      }} />
    </div>
  );
}

// -- HOME TAB ------------------------------------------------------------------
function HomeTab({ stats }) {
  return (
    <div>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>Overview</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Total Groups" value={stats?.total_groups} accent="#6366f1" />
        <StatCard label="Monitored" value={stats?.monitored_groups} accent="#22d3ee" />
        <StatCard label="Messages Saved" value={stats?.messages_saved} accent="#a78bfa" />
        <StatCard label="Relays Sent" value={stats?.relays_sent} accent="#34d399" />
        <StatCard label="Broadcasts" value={stats?.broadcasts_sent} accent="#f59e0b" />
      </div>
      <div style={{
        background: "#12121a", border: "1px solid #1e1e2e",
        borderRadius: 14, padding: 24
      }}>
        <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 16 }}>AI  Quick Commands</h3>
        {[
          ["!groups", "List all your Telegram groups"],
          ["!sync", "Refresh your group list from Telegram"],
          ["!digest", "Get your daily summary right now"],
          ["!status", "Check what features are running"],
          ["!pause all", "Pause the entire agent"],
          ["!resume all", "Resume everything"],
        ].map(([cmd, desc]) => (
          <div key={cmd} style={{
            display: "flex", gap: 16, alignItems: "center",
            padding: "10px 0", borderBottom: "1px solid #1a1a2a"
          }}>
            <code style={{
              color: "#a78bfa", background: "#1a1228", padding: "3px 10px",
              borderRadius: 6, fontSize: 13, fontFamily: "'DM Mono', monospace", minWidth: 130
            }}>{cmd}</code>
            <span style={{ color: "#888", fontSize: 14 }}>{desc}</span>
          </div>
        ))}
        <p style={{ color: "#555", fontSize: 13, marginTop: 16, fontStyle: "italic" }}>
          Send these commands to your Saved Messages on Telegram
        </p>
      </div>
    </div>
  );
}

// -- GROUPS TAB ----------------------------------------------------------------
function GroupsTab({ api }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/groups").then((data) => {
      setGroups(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const toggleMonitor = async (id, current) => {
    await api.post(`/groups/${id}/monitor?state=${!current}`);
    setGroups((g) => g.map((gr) => gr.id === id ? { ...gr, is_monitored: !current } : gr));
  };

  const toggleMedia = async (id, current) => {
    await api.post(`/groups/${id}/auto-save?state=${!current}`);
    setGroups((g) => g.map((gr) => gr.id === id ? { ...gr, auto_save_media: !current } : gr));
  };

  if (loading) return <p style={{ color: "#555" }}>Loading groups...</p>;

  return (
    <div>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>
        Your Groups ({groups.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map((g) => (
          <div key={g.id} style={{
            background: "#12121a", border: "1px solid #1e1e2e",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap"
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{g.name}</div>
              <div style={{ color: "#555", fontSize: 13, marginTop: 3 }}>
                {g.member_count || 0} members
                {g.username && <span> · @{g.username}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>Monitor</div>
                <Toggle value={g.is_monitored} onChange={() => toggleMonitor(g.id, g.is_monitored)} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>Auto-save Media</div>
                <Toggle value={g.auto_save_media} onChange={() => toggleMedia(g.id, g.auto_save_media)} />
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p style={{ color: "#555" }}>No groups yet. Send <code style={{ color: "#a78bfa" }}>!sync</code> on Telegram first.</p>
        )}
      </div>
    </div>
  );
}

// -- RELAY TAB -----------------------------------------------------------------
function RelayTab({ api }) {
  const [groups, setGroups] = useState([]);
  const [relays, setRelays] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [keywords, setKeywords] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/groups").then((d) => setGroups(Array.isArray(d) ? d : []));
    api.get("/relay").then((d) => setRelays(Array.isArray(d) ? d : []));
  }, []);

  const addRelay = async () => {
    if (!from || !to) return;
    await api.post("/relay", { source_id: parseInt(from), target_id: parseInt(to), keywords });
    setMsg("OK  Relay rule saved!");
    api.get("/relay").then((d) => setRelays(Array.isArray(d) ? d : []));
  };

  return (
    <div>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>Group Relay</h2>
      <div style={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>Add Relay Rule</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <select value={from} onChange={(e) => setFrom(e.target.value)}
            style={{ padding: "12px 14px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", fontSize: 14 }}>
            <option value="">Select source group...</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={to} onChange={(e) => setTo(e.target.value)}
            style={{ padding: "12px 14px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", fontSize: 14 }}>
            <option value="">Select target group...</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input placeholder="Keywords to filter (optional, comma separated)" value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            style={{ padding: "12px 14px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", fontSize: 14 }} />
          <button onClick={addRelay} style={{
            padding: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: 8, color: "#fff", fontSize: 15,
            fontWeight: 700, cursor: "pointer"
          }}>Add Relay Rule</button>
          {msg && <p style={{ color: "#34d399", fontSize: 14 }}>{msg}</p>}
        </div>
      </div>
      <h3 style={{ color: "#fff", fontSize: 16, margin: "0 0 16px" }}>Active Relay Rules</h3>
      {relays.map((r) => (
        <div key={r.id} style={{
          background: "#12121a", border: "1px solid #1e1e2e",
          borderRadius: 12, padding: "14px 18px", marginBottom: 10,
          display: "flex", gap: 12, alignItems: "center"
        }}>
          <span style={{ color: "#6366f1", fontWeight: 600 }}>{r.name}</span>
          <span style={{ color: "#555" }}>-></span>
          <span style={{ color: "#34d399" }}>{r.relay_target_id}</span>
          {r.relay_keywords && <span style={{ color: "#f59e0b", fontSize: 13 }}>Keywords: {r.relay_keywords}</span>}
        </div>
      ))}
      {relays.length === 0 && <p style={{ color: "#555" }}>No relay rules yet.</p>}
    </div>
  );
}

// -- BROADCAST TAB -------------------------------------------------------------
function BroadcastTab({ api }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/groups").then((d) => setGroups(Array.isArray(d) ? d : []));
  }, []);

  const sendBroadcast = async () => {
    if (!selectedGroup || !message.trim()) return;
    setLoading(true);
    const group = groups.find((g) => g.id === parseInt(selectedGroup));
    const res = await api.post("/broadcast", { group_name: group?.name, message });
    setStatus(res.message || "Queued!");
    setLoading(false);
    setMessage("");
  };

  return (
    <div>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Broadcaster</h2>
      <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>
        Send a DM to every member of a group. Agent delivers with a delay to avoid bans.
      </p>
      <div style={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 14, padding: 24 }}>
        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}>
          <option value="">Select group to broadcast to...</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.member_count || 0} members)</option>)}
        </select>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows={5} style={{
            width: "100%", padding: "12px 14px", background: "#0a0a0f",
            border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff",
            fontSize: 14, resize: "vertical", boxSizing: "border-box",
            fontFamily: "inherit", marginBottom: 12
          }} />
        <div style={{ background: "#1a1228", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ color: "#a78bfa", fontSize: 13, margin: 0 }}>
            Warning: This will DM every member of the selected group. A 3-second delay is added between each message to protect your account.
          </p>
        </div>
        <button onClick={sendBroadcast} disabled={loading || !selectedGroup || !message.trim()}
          style={{
            width: "100%", padding: "14px", background: loading ? "#2a2a3a" : "linear-gradient(135deg, #f59e0b, #ef4444)",
            border: "none", borderRadius: 8, color: "#fff", fontSize: 15,
            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
          }}>
          {loading ? "Sending..." : "Broadcast  Send Broadcast"}
        </button>
        {status && <p style={{ color: "#34d399", fontSize: 14, marginTop: 12 }}>{status}</p>}
      </div>
    </div>
  );
}

// -- SETTINGS / AI UPDATER TAB -------------------------------------------------
function SettingsTab({ api }) {
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/features").then((d) => setHistory(Array.isArray(d) ? d : []));
  }, []);

  const submitRequest = async () => {
    if (!request.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await api.post("/feature", { request });
    setResult(res);
    setLoading(false);
    setRequest("");
    api.get("/features").then((d) => setHistory(Array.isArray(d) ? d : []));
  };

  return (
    <div>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>AI Self-Updater</h2>
      <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>
        Describe any new feature in plain English. Claude writes the code, pushes to GitHub, and Railway redeploys automatically.
      </p>

      <div style={{ background: "#12121a", border: "1px solid #6366f133", borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: "#a78bfa", margin: "0 0 16px", fontSize: 15 }}>AI  Request New Feature</h3>
        <textarea value={request} onChange={(e) => setRequest(e.target.value)}
          placeholder='Example: "Save all links shared in my Tech group to a separate list I can view in the dashboard"'
          rows={4}
          style={{
            width: "100%", padding: "14px", background: "#0a0a0f",
            border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff",
            fontSize: 14, resize: "vertical", boxSizing: "border-box",
            fontFamily: "inherit", marginBottom: 12
          }} />
        <button onClick={submitRequest} disabled={loading || !request.trim()} style={{
          width: "100%", padding: "14px",
          background: loading ? "#2a2a3a" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", borderRadius: 8, color: "#fff", fontSize: 15,
          fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
        }}>
          {loading ? "AI is writing your code..." : "Build & Deploy Feature"}
        </button>
        {result && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 8,
            background: result.success ? "#0a2a1a" : "#2a0a0a",
            border: `1px solid ${result.success ? "#34d399" : "#f87171"}33`
          }}>
            <p style={{ color: result.success ? "#34d399" : "#f87171", fontSize: 14, margin: 0 }}>
              {result.message}
            </p>
            {result.commit && (
              <p style={{ color: "#555", fontSize: 12, margin: "8px 0 0", fontFamily: "'DM Mono', monospace" }}>
                Commit: {result.commit}
              </p>
            )}
          </div>
        )}
      </div>

      <h3 style={{ color: "#fff", fontSize: 16, margin: "0 0 16px" }}>Feature History</h3>
      {history.map((f) => (
        <div key={f.id} style={{
          background: "#12121a", border: "1px solid #1e1e2e",
          borderRadius: 10, padding: "14px 18px", marginBottom: 10
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p style={{ color: "#ddd", fontSize: 14, margin: 0, flex: 1 }}>{f.request}</p>
            <span style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 12, marginLeft: 12,
              background: f.status === "deployed" ? "#0a2a1a" : "#2a2a0a",
              color: f.status === "deployed" ? "#34d399" : "#f59e0b"
            }}>{f.status}</span>
          </div>
          {f.github_commit && (
            <p style={{ color: "#555", fontSize: 12, margin: "6px 0 0", fontFamily: "'DM Mono', monospace" }}>
              {f.github_commit}
            </p>
          )}
        </div>
      ))}
      {history.length === 0 && <p style={{ color: "#555" }}>No feature requests yet.</p>}
    </div>
  );
}

// -- MAIN APP ------------------------------------------------------------------
export default function App() {
  const [secret, setSecret] = useState(localStorage.getItem("agent_secret") || "");
  const [tab, setTab] = useState("home");
  const [stats, setStats] = useState(null);

  const api = useApi(secret);

  useEffect(() => {
    if (secret) api.get("/stats").then(setStats);
  }, [secret]);

  if (!secret) return <LoginScreen onLogin={setSecret} />;

  const tabs = [
    { id: "home", label: "Home", icon: icons.home },
    { id: "groups", label: "Groups", icon: icons.groups },
    { id: "relay", label: "Relay", icon: icons.relay },
    { id: "broadcast", label: "Broadcast", icon: icons.broadcast },
    { id: "settings", label: "AI Updater", icon: icons.zap },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Syne', sans-serif", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#12121a", borderBottom: "1px solid #1e1e2e",
        padding: "16px 24px", display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 28 }}>Robot </span>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Telegram AI Agent</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#555", fontFamily: "'DM Mono', monospace" }}>Brandash Media</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
          <span style={{ color: "#34d399", fontSize: 13 }}>Live</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{
        background: "#12121a", borderBottom: "1px solid #1e1e2e",
        display: "flex", overflowX: "auto", padding: "0 16px"
      }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "14px 18px", background: "none",
            border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 8, whiteSpace: "nowrap",
            color: tab === t.id ? "#a78bfa" : "#555",
            borderBottom: `2px solid ${tab === t.id ? "#a78bfa" : "transparent"}`,
            fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
            fontFamily: "'Syne', sans-serif", transition: "all 0.15s"
          }}>
            <Icon d={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "home" && <HomeTab stats={stats} />}
            {tab === "groups" && <GroupsTab api={api} />}
            {tab === "relay" && <RelayTab api={api} />}
            {tab === "broadcast" && <BroadcastTab api={api} />}
            {tab === "settings" && <SettingsTab api={api} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
