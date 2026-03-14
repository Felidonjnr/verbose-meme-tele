import os
import logging
import mimetypes
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument
from database import db

logger = logging.getLogger(__name__)
MEDIA_DIR = "downloads"
os.makedirs(MEDIA_DIR, exist_ok=True)

async def save_media(client, message, group_name: str) -> str | None:
    """Save a single media message to local storage + log to Supabase"""
    try:
        path = await client.download_media(message, file=MEDIA_DIR)
        if path:
            media_type = "photo" if isinstance(message.media, MessageMediaPhoto) else "document"
            db.save_message({
                "group_id": message.chat_id,
                "group_name": group_name,
                "sender": "auto-save",
                "text": f"[Media saved: {os.path.basename(path)}]",
                "has_media": True,
                "media_type": media_type,
                "media_url": path,
                "timestamp": message.date.isoformat(),
            })
            logger.info(f"💾 Saved media: {path}")
            return path
    except Exception as e:
        logger.error(f"Media save error: {e}")
    return None

async def scrape_group_media(client, group_name: str, limit: int = 200) -> int:
    """Scrape all media from a group's history"""
    try:
        target = None
        async for dialog in client.iter_dialogs():
            if group_name.lower() in dialog.name.lower():
                target = dialog
                break

        if not target:
            logger.error(f"Group not found: {group_name}")
            return 0

        count = 0
        async for message in client.iter_messages(target.entity, limit=limit):
            if message.media:
                if isinstance(message.media, (MessageMediaPhoto, MessageMediaDocument)):
                    path = await save_media(client, message, target.name)
                    if path:
                        count += 1

        logger.info(f"✅ Scraped {count} media from {group_name}")
        return count

    except Exception as e:
        logger.error(f"Scrape error: {e}")
        return 0
