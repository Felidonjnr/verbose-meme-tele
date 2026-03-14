from supabase import create_client
from config import Config
from datetime import datetime

cfg = Config()
supabase = create_client(cfg.SUPABASE_URL, cfg.SUPABASE_KEY)

# ─── SETUP (run once) ────────────────────────────────────────────────────────
# Paste this SQL into your Supabase SQL editor to create all tables:
SETUP_SQL = """
CREATE TABLE IF NOT EXISTS groups (
    id BIGINT PRIMARY KEY,
    name TEXT,
    username TEXT,
    member_count INT,
    is_monitored BOOLEAN DEFAULT false,
    is_relay_source BOOLEAN DEFAULT false,
    relay_target_id BIGINT,
    relay_keywords TEXT,
    auto_save_media BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT,
    group_name TEXT,
    sender TEXT,
    text TEXT,
    has_media BOOLEAN DEFAULT false,
    media_type TEXT,
    media_url TEXT,
    timestamp TIMESTAMPTZ,
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relay_logs (
    id BIGSERIAL PRIMARY KEY,
    from_group TEXT,
    to_group TEXT,
    message_preview TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast_logs (
    id BIGSERIAL PRIMARY KEY,
    group_name TEXT,
    message TEXT,
    recipients_count INT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS feature_requests (
    id BIGSERIAL PRIMARY KEY,
    request TEXT,
    status TEXT DEFAULT 'pending',
    github_commit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

# ─── GROUP OPERATIONS ────────────────────────────────────────────────────────
def upsert_group(group_data: dict):
    return supabase.table("groups").upsert(group_data).execute()

def get_all_groups():
    return supabase.table("groups").select("*").execute().data

def get_monitored_groups():
    return supabase.table("groups").select("*").eq("is_monitored", True).execute().data

def toggle_group_monitor(group_id: int, state: bool):
    return supabase.table("groups").update({"is_monitored": state}).eq("id", group_id).execute()

def set_relay(group_id: int, target_id: int, keywords: str = ""):
    return supabase.table("groups").update({
        "is_relay_source": True,
        "relay_target_id": target_id,
        "relay_keywords": keywords
    }).eq("id", group_id).execute()

def get_relay_groups():
    return supabase.table("groups").select("*").eq("is_relay_source", True).execute().data

def toggle_auto_save(group_id: int, state: bool):
    return supabase.table("groups").update({"auto_save_media": state}).eq("id", group_id).execute()

# ─── MESSAGE OPERATIONS ──────────────────────────────────────────────────────
def save_message(msg: dict):
    return supabase.table("messages").insert(msg).execute()

def get_messages(group_id: int, limit: int = 100):
    return supabase.table("messages").select("*")\
        .eq("group_id", group_id).order("timestamp", desc=True).limit(limit).execute().data

def get_recent_messages_all(limit: int = 200):
    return supabase.table("messages").select("*")\
        .order("saved_at", desc=True).limit(limit).execute().data

# ─── SETTINGS ────────────────────────────────────────────────────────────────
def get_setting(key: str, default: str = ""):
    res = supabase.table("agent_settings").select("value").eq("key", key).execute()
    return res.data[0]["value"] if res.data else default

def set_setting(key: str, value: str):
    return supabase.table("agent_settings").upsert({"key": key, "value": value}).execute()

# ─── FEATURE REQUESTS ────────────────────────────────────────────────────────
def save_feature_request(request: str):
    return supabase.table("feature_requests").insert({
        "request": request,
        "status": "pending"
    }).execute()

def update_feature_status(id: int, status: str, commit: str = ""):
    return supabase.table("feature_requests").update({
        "status": status,
        "github_commit": commit
    }).eq("id", id).execute()

def get_feature_requests():
    return supabase.table("feature_requests").select("*")\
        .order("created_at", desc=True).execute().data

# ─── LOGS ────────────────────────────────────────────────────────────────────
def log_relay(from_group: str, to_group: str, preview: str):
    return supabase.table("relay_logs").insert({
        "from_group": from_group, "to_group": to_group, "message_preview": preview
    }).execute()

def log_broadcast(group_name: str, message: str, count: int):
    return supabase.table("broadcast_logs").insert({
        "group_name": group_name, "message": message, "recipients_count": count
    }).execute()

def get_stats():
    groups = supabase.table("groups").select("id", count="exact").execute()
    monitored = supabase.table("groups").select("id", count="exact").eq("is_monitored", True).execute()
    messages = supabase.table("messages").select("id", count="exact").execute()
    relays = supabase.table("relay_logs").select("id", count="exact").execute()
    broadcasts = supabase.table("broadcast_logs").select("id", count="exact").execute()
    return {
        "total_groups": groups.count or 0,
        "monitored_groups": monitored.count or 0,
        "messages_saved": messages.count or 0,
        "relays_sent": relays.count or 0,
        "broadcasts_sent": broadcasts.count or 0,
    }
