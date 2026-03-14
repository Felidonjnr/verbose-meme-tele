import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import db
from agent.brain import summarise_for_digest
from config import Config

logger = logging.getLogger(__name__)

def start_digest_scheduler(client, config: Config):
    scheduler = AsyncIOScheduler()
    hour, minute = config.DIGEST_TIME.split(":")
    scheduler.add_job(
        send_daily_digest,
        trigger="cron",
        hour=int(hour),
        minute=int(minute),
        args=[client, config]
    )
    scheduler.start()
    logger.info(f"📅 Digest scheduler started — runs daily at {config.DIGEST_TIME}")

async def generate_digest(config: Config) -> str:
    """Generates digest from last 24 hours of saved messages"""
    monitored = db.get_monitored_groups()
    if not monitored:
        return "📭 No groups being monitored. Use !monitor [group name] to start."

    sections = [f"📰 **Daily Digest — {datetime.now().strftime('%B %d, %Y')}**\n"]

    for group in monitored:
        messages = db.get_messages(group["id"], limit=100)
        # Filter to last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        recent = [
            m for m in messages
            if m.get("timestamp") and m["timestamp"] > cutoff.isoformat()
        ]
        summary = summarise_for_digest(group["name"], recent, config)
        sections.append(summary)
        sections.append("")

    return "\n".join(sections)

async def send_daily_digest(client, config: Config):
    try:
        digest = await generate_digest(config)
        await client.send_message("me", digest)
        logger.info("✅ Daily digest sent")
    except Exception as e:
        logger.error(f"Digest error: {e}")
