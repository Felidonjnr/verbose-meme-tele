import logging
from telethon.tl.types import Channel, Chat
from database import db
from agent.brain import extract_key_info
from config import Config

logger = logging.getLogger(__name__)

async def extract_group_info(client, group_name: str, config: Config, limit: int = 100) -> str:
    """
    Scrapes last N messages from a group and uses Claude to extract key info
    """
    try:
        # Find group
        target = None
        async for dialog in client.iter_dialogs():
            if group_name.lower() in dialog.name.lower():
                target = dialog
                break

        if not target:
            return f"❌ Group not found: {group_name}. Try !sync first."

        # Pull messages
        messages = []
        async for msg in client.iter_messages(target.entity, limit=limit):
            if msg.text:
                messages.append({
                    "sender": getattr(await client.get_entity(msg.sender_id), "first_name", "Unknown") if msg.sender_id else "Unknown",
                    "text": msg.text,
                    "timestamp": msg.date.isoformat()
                })

        if not messages:
            return f"📭 No text messages found in **{group_name}**"

        result = extract_key_info(messages, config)
        return f"🔍 **Extract from {group_name}** (last {len(messages)} messages)\n\n{result}"

    except Exception as e:
        logger.error(f"Extract error: {e}")
        return f"❌ Error extracting from {group_name}: {str(e)}"
