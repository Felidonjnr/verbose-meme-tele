# 🤖 Telegram AI Agent — by Godshand / Brandash Media

Your personal AI-powered Telegram command center. Runs 24/7 in the cloud. Controlled from your phone.

---

## Features
- 📋 View & monitor all your Telegram groups
- 🔁 Auto-relay messages between groups (with keyword filters)
- 📨 Broadcast DMs to every member of any group
- 📥 Extract key info from any group using Claude AI
- 📸 Scrape & auto-save media (images, videos, files)
- 📰 Daily digest of all monitored groups
- ⚡ AI Self-Updater — type a feature, it builds & deploys itself
- ⏸ Pause/resume any feature at any time

---

## Setup Guide (Phone-Friendly)

### Step 1 — Get Telegram API credentials
1. Open browser → go to https://my.telegram.org/apps
2. Log in with your phone number
3. Create a new app (any name)
4. Copy your **API ID** and **API Hash**

### Step 2 — Get your Session String
You need to do this ONCE on any device with Python installed.

Option A — Use Google Colab (100% from phone, free):
1. Go to https://colab.research.google.com
2. Create new notebook
3. Run these cells:
```python
!pip install telethon
```
```python
from telethon import TelegramClient
from telethon.sessions import StringSession
import asyncio

API_ID = 12345678        # your API ID
API_HASH = "your_hash"  # your API Hash
PHONE = "+2348012345678" # your phone

async def get_session():
    async with TelegramClient(StringSession(), API_ID, API_HASH) as client:
        await client.start(phone=PHONE)
        print("SESSION STRING:")
        print(client.session.save())

await get_session()
```
4. Copy the session string it prints

### Step 3 — Set up Supabase
1. Go to https://supabase.com → create free account
2. Create new project
3. Go to SQL Editor → paste the SQL from `database/db.py` (the SETUP_SQL variable)
4. Run it to create all tables
5. Go to Settings → API → copy your **URL** and **anon key**

### Step 4 — Set up GitHub
1. Create new repo called `telegram-ai-agent`
2. Upload all these files to the repo
3. Go to Settings → Developer Settings → Personal Access Tokens
4. Create token with full `repo` access
5. Copy the token

### Step 5 — Deploy to Railway
1. Go to https://railway.app → sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `telegram-ai-agent` repo
4. Go to Variables tab and add ALL keys from `.env.example`
5. Click Deploy

### Step 6 — Deploy Dashboard to Vercel
1. Go to https://vercel.com → sign up with GitHub
2. Import your repo
3. Set Root Directory to `frontend`
4. Add env variable: `REACT_APP_API_URL` = your Railway URL
5. Deploy

---

## Controlling Your Agent

Send these commands to your **Saved Messages** on Telegram:

| Command | What it does |
|---|---|
| `!help` | See all commands |
| `!groups` | List all your groups |
| `!sync` | Refresh group list |
| `!monitor [group name]` | Start monitoring a group |
| `!relay from:[A] to:[B]` | Auto-forward messages |
| `!broadcast [group] \| [message]` | DM everyone in group |
| `!scrape [group name]` | Extract key info with AI |
| `!media [group name]` | Download all media |
| `!digest` | Get summary now |
| `!pause all` | Pause everything |
| `!resume all` | Resume everything |
| `!status` | Check agent status |

---

## Tech Stack
- **Backend**: Python + Telethon + FastAPI → Railway
- **Frontend**: React → Vercel  
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude Haiku (Anthropic)
- **Self-Update**: GitHub API

---

## Monthly Cost
| Service | Cost |
|---|---|
| Railway | Free tier / ~$5 |
| Vercel | Free |
| Supabase | Free |
| Anthropic (Claude Haiku) | ~$1–3 |
| **Total** | **~$1–8/month** |
