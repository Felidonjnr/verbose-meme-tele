import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Telegram
    TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID", 0))
    TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "")
    TELEGRAM_PHONE = os.getenv("TELEGRAM_PHONE", "")
    TELEGRAM_SESSION_STRING = os.getenv("TELEGRAM_SESSION_STRING", "")

    # Anthropic
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

    # GitHub
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
    GITHUB_REPO = os.getenv("GITHUB_REPO", "")

    # Google Drive
    GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")

    # App
    DIGEST_TIME = os.getenv("DIGEST_TIME", "08:00")
    DASHBOARD_SECRET = os.getenv("DASHBOARD_SECRET", "changeme")
    PORT = int(os.getenv("PORT", 8000))
