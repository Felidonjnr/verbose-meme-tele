from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from config import Config
from database import db
from agent.self_updater import process_feature_request

app = FastAPI(title="Telegram AI Agent API")
config = Config()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────
def verify_token(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    if token != config.DASHBOARD_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ── Models ────────────────────────────────────────────────────────────────────
class RelayRule(BaseModel):
    source_id: int
    target_id: int
    keywords: Optional[str] = ""

class BroadcastRequest(BaseModel):
    group_name: str
    message: str

class FeatureRequest(BaseModel):
    request: str

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Telegram AI Agent is running 🤖"}

@app.get("/stats")
def get_stats(authorization: str = Header(...)):
    verify_token(authorization)
    return db.get_stats()

@app.get("/groups")
def get_groups(authorization: str = Header(...)):
    verify_token(authorization)
    return db.get_all_groups()

@app.post("/groups/{group_id}/monitor")
def toggle_monitor(group_id: int, state: bool, authorization: str = Header(...)):
    verify_token(authorization)
    db.toggle_group_monitor(group_id, state)
    return {"success": True}

@app.post("/groups/{group_id}/auto-save")
def toggle_auto_save(group_id: int, state: bool, authorization: str = Header(...)):
    verify_token(authorization)
    db.toggle_auto_save(group_id, state)
    return {"success": True}

@app.post("/relay")
def set_relay(rule: RelayRule, authorization: str = Header(...)):
    verify_token(authorization)
    db.set_relay(rule.source_id, rule.target_id, rule.keywords)
    return {"success": True}

@app.get("/relay")
def get_relay_rules(authorization: str = Header(...)):
    verify_token(authorization)
    return db.get_relay_groups()

@app.get("/messages/{group_id}")
def get_messages(group_id: int, limit: int = 100, authorization: str = Header(...)):
    verify_token(authorization)
    return db.get_messages(group_id, limit)

@app.get("/messages")
def get_all_messages(limit: int = 200, authorization: str = Header(...)):
    verify_token(authorization)
    return db.get_recent_messages_all(limit)

@app.post("/broadcast")
async def broadcast(req: BroadcastRequest, authorization: str = Header(...)):
    verify_token(authorization)
    # This just logs the request; actual sending happens via the agent
    db.log_broadcast(req.group_name, req.message, 0)
    return {"success": True, "message": "Broadcast queued. Agent will process it."}

@app.post("/feature")
async def request_feature(req: FeatureRequest, authorization: str = Header(...)):
    verify_token(authorization)
    result = await process_feature_request(req.request, config)
    return result

@app.get("/features")
def get_features(authorization: str = Header(...)):
    verify_token(authorization)
    return db.get_feature_requests()

@app.get("/digest")
async def get_digest(authorization: str = Header(...)):
    verify_token(authorization)
    from agent.digest import generate_digest
    digest = await generate_digest(config)
    return {"digest": digest}
