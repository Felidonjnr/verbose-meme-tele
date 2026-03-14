import { useState, useEffect, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "https://your-app.onrender.com";

const useApi = (secret) => {
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };
  return {
    get: (p) => fetch(`${API_BASE}${p}`, { headers: h }).then(r => r.json()),
    post: (p, b) => fetch(`${API_BASE}${p}`, { method: "POST", headers: h, body: JSON.stringify(b) }).then(r => r.json()),
  };
};

const C = {
  bg: "#0d0d14", card: "#13131f", border: "#1e1e30", accent: "#7c6af7",
  cyan: "#22d3ee", text: "#e8e8f0", muted: "#555570",
  green: "#34d399", red: "#f87171", yellow: "#fbbf24",
};

const btn = (bg, color = "#fff") => ({
  padding: "11px 20px", background: bg, border: "none", borderRadius: 9,
  color, fontSize: 14, fontWeight: 700, cursor: "pointer",
});

// LOGIN
function Login({ onLogin }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const go = async () => {
    try {
      const r = await fetch(`${API_BASE}/stats`, { headers: { Authorization: `Bearer ${pw}` } });
      if (r.ok) { localStorage.setItem("ds", pw); onLogin(pw); }
      else setErr("Wrong password. Check DASHBOARD_SECRET in Render.");
    } catch { setErr("Cannot reach agent. Make sure Render is running."); }
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, width: "90%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F916;</div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Telegram AI Agent</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 28px" }}>by Brandash Media</p>
        <input type="password" placeholder="Dashboard password" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && go()}
          style={{ width: "100%", padding: "13px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
        {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 10px" }}>{err}</p>}
        <button onClick={go} style={{ ...btn(C.accent), width: "100%", padding: 14, fontSize: 16 }}>Enter Dashboard</button>
      </div>
    </div>
  );
}

// GROUP LIST SIDEBAR
function GroupList({ api, onSelect, selected }) {
  const [groups, setGroups] = useState([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/groups").then(d => { setGroups(Array.isArray(d) ? d : []); setLoading(false); }); }, []);
  const filtered = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", borderRight: `1px solid ${C.border}`, width: 280, flexShrink: 0 }}>
      <div style={{ padding: "14px 12px 10px", borderBottom: `1px solid ${C.border}` }}>
        <p style={{ color: C.text, fontWeight: 800, fontSize: 16, margin: "0 0 10px" }}>&#x1F4E1; Groups ({groups.length})</p>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <p style={{ color: C.muted, padding: 16, fontSize: 13 }}>Loading...</p>}
        {filtered.map(g => (
          <div key={g.id} onClick={() => onSelect(g)} style={{
            padding: "11px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}`,
            background: selected?.id === g.id ? C.accent + "22" : "transparent",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
              {g.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{g.member_count || 0} members{g.is_monitored ? " · Live" : ""}</div>
            </div>
            {g.is_monitored && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />}
          </div>
        ))}
        {!loading && filtered.length === 0 && <p style={{ color: C.muted, padding: 16, fontSize: 13 }}>No groups. Send !sync on Telegram.</p>}
      </div>
    </div>
  );
}

// MESSAGE BUBBLE
function Msg({ m }) {
  const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{m.sender || "Unknown"}</span>
        <span style={{ color: C.muted, fontSize: 11 }}>{time}</span>
      </div>
      {m.text && <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</p>}
      {m.has_media && (
        <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: C.cyan + "22", borderRadius: 6, padding: "3px 10px" }}>
          <span style={{ color: C.cyan, fontSize: 12 }}>&#x1F4CE; {m.media_type || "media"}</span>
          {m.media_url && <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: C.cyan, fontSize: 12 }}>View</a>}
        </div>
      )}
    </div>
  );
}

// MAIN GROUP VIEWER
function GroupViewer({ group, api }) {
  const [msgs, setMsgs] = useState([]); const [loading, setLoading] = useState(false);
  const [monitored, setMonitored] = useState(false); const [autoMedia, setAutoMedia] = useState(false);
  const [tab, setTab] = useState("messages");
  const [summary, setSummary] = useState(""); const [summaryLoading, setSummaryLoading] = useState(false);
  const [bcastMsg, setBcastMsg] = useState(""); const [bcastStatus, setBcastStatus] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState(""); const [scrapeLoading, setScrapeLoading] = useState(false);
  const [relayTarget, setRelayTarget] = useState(""); const [relayKeywords, setRelayKeywords] = useState(""); const [relayStatus, setRelayStatus] = useState("");
  const [allGroups, setAllGroups] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    if (!group) return;
    setMsgs([]); setSummary(""); setBcastStatus(""); setScrapeStatus(""); setRelayStatus("");
    setMonitored(group.is_monitored || false); setAutoMedia(group.auto_save_media || false);
    setLoading(true);
    api.get(`/messages/${group.id}?limit=150`).then(d => { setMsgs(Array.isArray(d) ? d.reverse() : []); setLoading(false); });
    api.get("/groups").then(d => setAllGroups(Array.isArray(d) ? d : []));
  }, [group?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  if (!group) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 52 }}>&#x1F4AC;</div>
      <p style={{ color: C.muted, fontSize: 16 }}>Select a group from the left to view messages</p>
    </div>
  );

  const toggleMonitor = async () => { await api.post(`/groups/${group.id}/monitor?state=${!monitored}`); setMonitored(!monitored); };
  const toggleAutoMedia = async () => { await api.post(`/groups/${group.id}/auto-save?state=${!autoMedia}`); setAutoMedia(!autoMedia); };

  const getSummary = async () => {
    setSummaryLoading(true);
    const msgTexts = msgs.slice(-50).map(m => `${m.sender}: ${m.text}`).join("\n");
    if (!msgTexts.trim()) { setSummary("No messages to summarise yet. Enable monitoring first."); setSummaryLoading(false); return; }
    const res = await api.post("/feature", { request: `Summarise these messages from group "${group.name}" in 5 bullet points:\n\n${msgTexts}` });
    setSummary(res.message || "Could not generate summary. Check Claude API credits."); setSummaryLoading(false);
  };

  const sendBcast = async () => {
    if (!bcastMsg.trim()) return;
    setBcastStatus("Sending...");
    await api.post("/broadcast", { group_name: group.name, message: bcastMsg });
    setBcastStatus(`Queued! Agent will DM all ${group.member_count || "?"} members with a delay.`);
    setBcastMsg("");
  };

  const scrapeMedia = async () => {
    setScrapeLoading(true); setScrapeStatus("");
    const res = await api.post("/feature", { request: `Scrape and save all media files from the Telegram group named "${group.name}" to Supabase storage` });
    setScrapeStatus(res.message || "Scrape started. Check logs."); setScrapeLoading(false);
  };

  const setRelay = async () => {
    if (!relayTarget) { setRelayStatus("Please select a target group."); return; }
    const tgt = allGroups.find(g => g.id === parseInt(relayTarget));
    await api.post("/relay", { source_id: group.id, target_id: parseInt(relayTarget), keywords: relayKeywords });
    setRelayStatus(`Relay set: ${group.name} -> ${tgt?.name || relayTarget}${relayKeywords ? ` (keywords: ${relayKeywords})` : ""}`);
  };

  const tabs = [
    { id: "messages", label: "Messages" },
    { id: "summary", label: "AI Summary" },
    { id: "media", label: "Media" },
    { id: "broadcast", label: "Broadcast" },
    { id: "relay", label: "Relay" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: C.accent, flexShrink: 0 }}>
          {group.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{group.name}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>{group.member_count || 0} members &middot; {msgs.length} messages saved</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={toggleMonitor} style={{ ...btn(monitored ? C.green + "22" : C.border, monitored ? C.green : C.muted), padding: "7px 12px", fontSize: 12 }}>
            {monitored ? "&#x2705; Monitoring ON" : "Monitor OFF"}
          </button>
          <button onClick={toggleAutoMedia} style={{ ...btn(autoMedia ? C.cyan + "22" : C.border, autoMedia ? C.cyan : C.muted), padding: "7px 12px", fontSize: 12 }}>
            {autoMedia ? "&#x1F4BE; Auto-save Media ON" : "Auto-save Media OFF"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
            color: tab === t.id ? C.accent : C.muted, fontWeight: tab === t.id ? 700 : 400,
            borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`, fontSize: 13, whiteSpace: "nowrap"
          }}>{t.label}</button>
        ))}
      </div>

      {/* MESSAGES */}
      {tab === "messages" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {loading && <p style={{ color: C.muted }}>Loading messages...</p>}
          {!loading && msgs.length === 0 && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: C.muted, fontSize: 15, marginBottom: 8 }}>No messages saved yet.</p>
              <p style={{ color: C.muted, fontSize: 13 }}>Enable Monitoring above to start saving new messages, or send <code style={{ color: C.accent }}>!scrape {group.name}</code> in your Telegram Saved Messages to pull history.</p>
            </div>
          )}
          {msgs.map((m, i) => <Msg key={i} m={m} />)}
          <div ref={bottomRef} />
        </div>
      )}

      {/* AI SUMMARY */}
      {tab === "summary" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Claude AI analyses the last 50 messages and gives you a summary of what happened.</p>
          <button onClick={getSummary} disabled={summaryLoading} style={{ ...btn(C.accent), marginBottom: 20, opacity: summaryLoading ? 0.6 : 1 }}>
            {summaryLoading ? "Summarising..." : "Generate AI Summary"}
          </button>
          {summary && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <p style={{ color: C.text, fontSize: 14, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{summary}</p>
            </div>
          )}
        </div>
      )}

      {/* MEDIA */}
      {tab === "media" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <h3 style={{ color: C.text, margin: "0 0 8px" }}>Media Scraper</h3>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
            Scrape all images, videos, and files from this group. They will be saved to Supabase storage and you can view links here.
          </p>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ color: C.text, fontWeight: 700, margin: "0 0 6px" }}>Auto-save new media</p>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 12px" }}>Any new image, video or file posted in this group will be saved automatically.</p>
            <button onClick={toggleAutoMedia} style={{ ...btn(autoMedia ? C.green : C.border, autoMedia ? "#fff" : C.muted) }}>
              {autoMedia ? "ON - Click to disable" : "OFF - Click to enable"}
            </button>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <p style={{ color: C.text, fontWeight: 700, margin: "0 0 6px" }}>Scrape existing media</p>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 12px" }}>Pull all media from this group's history right now.</p>
            <button onClick={scrapeMedia} disabled={scrapeLoading} style={{ ...btn(C.cyan + "cc"), marginBottom: scrapeStatus ? 12 : 0, opacity: scrapeLoading ? 0.6 : 1 }}>
              {scrapeLoading ? "Scraping..." : "Start Scraping Media"}
            </button>
            {scrapeStatus && <p style={{ color: C.green, fontSize: 13, margin: 0 }}>{scrapeStatus}</p>}
          </div>
          <div style={{ marginTop: 20 }}>
            <p style={{ color: C.muted, fontSize: 13 }}>Media files saved from this group:</p>
            {msgs.filter(m => m.has_media).length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No media saved yet.</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {msgs.filter(m => m.has_media).map((m, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                  <div style={{ color: C.cyan }}>{m.media_type || "file"}</div>
                  {m.media_url && <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: C.accent, fontSize: 12 }}>Open</a>}
                  <div style={{ color: C.muted, fontSize: 11 }}>{m.sender}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST */}
      {tab === "broadcast" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <h3 style={{ color: C.text, margin: "0 0 8px" }}>Broadcast Message</h3>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Send a private DM to every member of <strong style={{ color: C.text }}>{group.name}</strong>.</p>
          <textarea value={bcastMsg} onChange={e => setBcastMsg(e.target.value)} placeholder="Type your message here..." rows={5}
            style={{ width: "100%", padding: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12, outline: "none" }} />
          <div style={{ background: "#1a1228", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ color: C.yellow, fontSize: 13, margin: 0 }}>Warning: This DMs all {group.member_count || "?"} members. A 3-second delay is added between each message to protect your account.</p>
          </div>
          <button onClick={sendBcast} style={{ ...btn("linear-gradient(135deg,#f59e0b,#ef4444)"), width: "100%" }}>Send Broadcast</button>
          {bcastStatus && <p style={{ color: C.green, fontSize: 14, marginTop: 12 }}>{bcastStatus}</p>}
        </div>
      )}

      {/* RELAY */}
      {tab === "relay" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <h3 style={{ color: C.text, margin: "0 0 8px" }}>Relay Messages</h3>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Automatically forward messages from <strong style={{ color: C.text }}>{group.name}</strong> to another group.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: C.muted, fontSize: 13, display: "block", marginBottom: 6 }}>Forward to:</label>
              <select value={relayTarget} onChange={e => setRelayTarget(e.target.value)}
                style={{ width: "100%", padding: "11px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }}>
                <option value="">Select target group...</option>
                {allGroups.filter(g => g.id !== group.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 13, display: "block", marginBottom: 6 }}>Keywords to filter (optional, comma separated):</label>
              <input value={relayKeywords} onChange={e => setRelayKeywords(e.target.value)} placeholder="e.g. signal, urgent, announcement"
                style={{ width: "100%", padding: "11px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={setRelay} style={{ ...btn(C.accent) }}>Set Relay Rule</button>
            {relayStatus && <p style={{ color: C.green, fontSize: 14 }}>{relayStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// STATS BAR
function StatsBar({ stats, onSync }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", alignItems: "center" }}>
      {[
        ["Groups", stats?.total_groups, C.accent],
        ["Monitored", stats?.monitored_groups, C.green],
        ["Messages", stats?.messages_saved, C.cyan],
        ["Relays", stats?.relays_sent, C.yellow],
        ["Broadcasts", stats?.broadcasts_sent, "#f87171"],
      ].map(([l, v, color]) => (
        <div key={l} style={{ background: C.card, border: `1px solid ${color}33`, borderRadius: 10, padding: "8px 14px", minWidth: 80 }}>
          <div style={{ color, fontSize: 18, fontWeight: 800 }}>{v ?? "-"}</div>
          <div style={{ color: C.muted, fontSize: 11 }}>{l}</div>
        </div>
      ))}
      <button onClick={onSync} style={{ ...btn(C.border, C.muted), marginLeft: "auto", padding: "8px 14px", fontSize: 13 }}>Sync Groups</button>
    </div>
  );
}

// AI UPDATER PANEL
function AIUpdater({ api }) {
  const [req, setReq] = useState(""); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null); const [history, setHistory] = useState([]);
  useEffect(() => { api.get("/features").then(d => setHistory(Array.isArray(d) ? d : [])); }, []);
  const submit = async () => {
    if (!req.trim()) return; setLoading(true); setResult(null);
    const res = await api.post("/feature", { request: req });
    setResult(res); setLoading(false); setReq("");
    api.get("/features").then(d => setHistory(Array.isArray(d) ? d : []));
  };
  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h2 style={{ color: C.text, margin: "0 0 6px" }}>AI Self-Updater</h2>
      <p style={{ color: C.muted, fontSize: 14, margin: "0 0 20px" }}>Describe any new feature. Claude writes the code, pushes to GitHub, Render redeploys automatically.</p>
      <textarea value={req} onChange={e => setReq(e.target.value)} rows={4} placeholder='Example: "Save all links from my Bible study group to a separate list I can view here"'
        style={{ width: "100%", padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12, outline: "none" }} />
      <button onClick={submit} disabled={loading || !req.trim()} style={{ ...btn(C.accent), width: "100%", padding: 14, fontSize: 15, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Claude is writing your code..." : "Build & Deploy Feature"}
      </button>
      {result && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: result.success ? "#0a2a1a" : "#2a0a0a", border: `1px solid ${result.success ? C.green : C.red}33` }}>
          <p style={{ color: result.success ? C.green : C.red, margin: 0, fontSize: 14 }}>{result.message}</p>
        </div>
      )}
      <h3 style={{ color: C.text, margin: "24px 0 12px" }}>Feature History</h3>
      {history.map(f => (
        <div key={f.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <p style={{ color: C.text, fontSize: 14, margin: 0, flex: 1 }}>{f.request}</p>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, background: f.status === "deployed" ? C.green + "22" : C.yellow + "22", color: f.status === "deployed" ? C.green : C.yellow, flexShrink: 0 }}>{f.status}</span>
        </div>
      ))}
      {history.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>No feature requests yet.</p>}
    </div>
  );
}

// MAIN APP
export default function App() {
  const [secret, setSecret] = useState(localStorage.getItem("ds") || "");
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("groups");
  const api = useApi(secret);

  useEffect(() => { if (secret) api.get("/stats").then(setStats); }, [secret]);

  const syncGroups = async () => {
    await api.post("/feature", { request: "sync all telegram groups" });
    api.get("/stats").then(setStats);
    alert("Sync requested! Send !sync on Telegram for instant sync.");
  };

  if (!secret) return <Login onLogin={setSecret} />;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "system-ui", color: C.text }}>
      {/* Top Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 24 }}>&#x1F916;</span>
        <span style={{ fontWeight: 800, fontSize: 17 }}>Telegram AI Agent</span>
        <span style={{ color: C.muted, fontSize: 13 }}>by Brandash Media</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setView("groups")} style={{ ...btn(view === "groups" ? C.accent : C.border, view === "groups" ? "#fff" : C.muted), padding: "7px 14px", fontSize: 13 }}>Groups</button>
          <button onClick={() => setView("ai")} style={{ ...btn(view === "ai" ? C.accent : C.border, view === "ai" ? "#fff" : C.muted), padding: "7px 14px", fontSize: 13 }}>AI Updater</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <span style={{ color: C.green, fontSize: 13 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={stats} onSync={syncGroups} />

      {/* Body */}
      {view === "groups" ? (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <GroupList api={api} onSelect={setSelected} selected={selected} />
          <GroupViewer group={selected} api={api} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AIUpdater api={api} />
        </div>
      )}
    </div>
  );
}
