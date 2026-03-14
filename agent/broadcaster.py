import asyncio
import logging
from telethon.tl.functions.channels import GetParticipantsRequest
from telethon.tl.types import ChannelParticipantsSearch
from database import db

logger = logging.getLogger(__name__)

async def broadcast_to_group(client, group_name: str, message: str) -> int:
    """
    Sends a DM to every member of the specified group.
    Has a delay between messages to avoid Telegram spam detection.
    """
    try:
        # Find group
        target = None
        async for dialog in client.iter_dialogs():
            if group_name.lower() in dialog.name.lower():
                target = dialog
                break

        if not target:
            logger.error(f"Group not found: {group_name}")
            return 0

        count = 0
        offset = 0
        limit = 100

        while True:
            participants = await client(GetParticipantsRequest(
                channel=target.entity,
                filter=ChannelParticipantsSearch(""),
                offset=offset,
                limit=limit,
                hash=0
            ))

            if not participants.users:
                break

            for user in participants.users:
                if user.bot or user.is_self:
                    continue
                try:
                    await client.send_message(user.id, message)
                    count += 1
                    logger.info(f"Sent to {user.first_name} ({user.id})")
                    # 3 second delay between each DM to avoid ban
                    await asyncio.sleep(3)
                except Exception as e:
                    logger.warning(f"Could not send to {user.id}: {e}")
                    await asyncio.sleep(1)

            offset += len(participants.users)
            if len(participants.users) < limit:
                break

        db.log_broadcast(group_name, message, count)
        logger.info(f"Broadcast complete: {count} members in {group_name}")
        return count

    except Exception as e:
        logger.error(f"Broadcast error: {e}")
        return 0
