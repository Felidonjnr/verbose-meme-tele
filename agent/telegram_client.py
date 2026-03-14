import asyncio
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.tl.types import Channel, Chat, User
from config import Config
from database import db

logger = logging.getLogger(__name__)

class TelegramAgent:
    def __init__(self, config: Config):
        self.config = config
        self.client = TelegramClient(
            StringSession(config.TELEGRAM_SESSION_STRING),
            config.TELEGRAM_API_ID,
            config.TELEGRAM_API_HASH
        )
        self.is_running = True
        self.paused_features = set()

    async def start(self):
        await self.client.start(phone=self.config.TELEGRAM_PHONE)
        logger.info("✅ Connected to Telegram as your account")

        # Register event handlers
        self.client.add_event_handler(self._handle_new_message, events.NewMessage)
        self.client.add_event_handler(self._handle_commands, events.NewMessage(outgoing=True))

        # Sync all groups on startup
        await self.sync_groups()

        # Start scheduler
        from agent.digest import start_digest_scheduler
        start_digest_scheduler(self.client, self.config)

        logger.info("🤖 Agent is fully running")
        await self.client.run_until_disconnected()

    async def sync_groups(self):
        """Pull all your Telegram groups and save to Supabase"""
        logger.info("🔄 Syncing all your groups...")
        count = 0
        async for dialog in self.client.iter_dialogs():
            entity = dialog.entity
            if isinstance(entity, (Channel, Chat)):
                group_data = {
                    "id": entity.id,
                    "name": dialog.name,
                    "username": getattr(entity, "username", None),
                    "member_count": getattr(entity, "participants_count", 0),
                }
                db.upsert_group(group_data)
                count += 1
        logger.info(f"✅ Synced {count} groups")
        return count

    async def _handle_new_message(self, event):
        """Handles all incoming messages"""
        if not self.is_running:
            return

        try:
            chat = await event.get_chat()
            sender = await event.get_sender()

            # Skip if it's a private DM (except Saved Messages)
            if isinstance(sender, User) and not event.is_private:
                return

            group_id = event.chat_id
            group_name = getattr(chat, "title", "Unknown")

            # ── Save message if group is monitored ──
            monitored_ids = [g["id"] for g in db.get_monitored_groups()]
            if "monitor" not in self.paused_features and group_id in monitored_ids:
                msg_data = {
                    "group_id": group_id,
                    "group_name": group_name,
                    "sender": getattr(sender, "first_name", "Unknown") if sender else "Unknown",
                    "text": event.raw_text or "",
                    "has_media": event.message.media is not None,
                    "media_type": type(event.message.media).__name__ if event.message.media else None,
                    "timestamp": event.message.date.isoformat(),
                }
                db.save_message(msg_data)

            # ── Handle relay ──
            if "relay" not in self.paused_features:
                relay_groups = db.get_relay_groups()
                for rg in relay_groups:
                    if rg["id"] == group_id:
                        keywords = rg.get("relay_keywords", "")
                        msg_text = event.raw_text or ""
                        should_relay = True
                        if keywords:
                            kw_list = [k.strip().lower() for k in keywords.split(",")]
                            should_relay = any(k in msg_text.lower() for k in kw_list)
                        if should_relay and rg.get("relay_target_id"):
                            await self.client.send_message(
                                rg["relay_target_id"],
                                f"📡 From **{group_name}**:\n\n{msg_text}"
                            )
                            db.log_relay(group_name, str(rg["relay_target_id"]), msg_text[:100])

            # ── Auto-save media ──
            if "media" not in self.paused_features and event.message.media:
                auto_save_groups = [g["id"] for g in db.get_all_groups() if g.get("auto_save_media")]
                if group_id in auto_save_groups:
                    from agent.media_scraper import save_media
                    await save_media(self.client, event.message, group_name)

        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def _handle_commands(self, event):
        """
        Handle commands you send to yourself (Saved Messages)
        All commands start with !
        """
        try:
            me = await self.client.get_me()
            if event.chat_id != me.id:
                return

            text = event.raw_text.strip()
            if not text.startswith("!"):
                return

            parts = text.split(" ", 1)
            cmd = parts[0].lower()
            args = parts[1] if len(parts) > 1 else ""

            response = await self._process_command(cmd, args)
            if response:
                await self.client.send_message("me", response)

        except Exception as e:
            logger.error(f"Command error: {e}")

    async def _process_command(self, cmd: str, args: str) -> str:
        if cmd == "!help":
            return (
                "🤖 **Telegram AI Agent — Commands**\n\n"
                "📋 **Groups**\n"
                "`!groups` — List all your groups\n"
                "`!monitor [group name]` — Start monitoring a group\n"
                "`!unmonitor [group name]` — Stop monitoring\n\n"
                "🔁 **Relay**\n"
                "`!relay from:[Group A] to:[Group B]` — Forward messages\n"
                "`!relay from:[Group A] to:[Group B] keywords:[word1,word2]`\n"
                "`!stoprelay [Group A]` — Stop relay\n\n"
                "📨 **Broadcast**\n"
                "`!broadcast [group name] | [your message]`\n\n"
                "📥 **Scrape**\n"
                "`!scrape [group name]` — Extract info from group\n"
                "`!media [group name]` — Download all media\n\n"
                "📰 **Digest**\n"
                "`!digest` — Get summary now\n\n"
                "⚙️ **Control**\n"
                "`!pause [feature]` — Pause: monitor/relay/broadcast/media/all\n"
                "`!resume [feature]` — Resume a feature\n"
                "`!status` — See what's running\n"
                "`!sync` — Refresh your group list"
            )

        elif cmd == "!groups":
            groups = db.get_all_groups()
            if not groups:
                return "No groups found. Try !sync first."
            lines = ["📋 **Your Groups:**\n"]
            for g in groups[:30]:
                icon = "🟢" if g.get("is_monitored") else "⚪"
                lines.append(f"{icon} {g['name']} ({g.get('member_count', 0)} members)")
            return "\n".join(lines)

        elif cmd == "!sync":
            count = await self.sync_groups()
            return f"✅ Synced {count} groups successfully."

        elif cmd == "!status":
            paused = ", ".join(self.paused_features) if self.paused_features else "none"
            stats = db.get_stats()
            return (
                f"🤖 **Agent Status**\n\n"
                f"✅ Running: Yes\n"
                f"⏸ Paused features: {paused}\n\n"
                f"📊 **Stats**\n"
                f"Groups tracked: {stats['total_groups']}\n"
                f"Monitored: {stats['monitored_groups']}\n"
                f"Messages saved: {stats['messages_saved']}\n"
                f"Relays sent: {stats['relays_sent']}\n"
                f"Broadcasts sent: {stats['broadcasts_sent']}"
            )

        elif cmd == "!monitor":
            groups = db.get_all_groups()
            match = next((g for g in groups if args.lower() in g["name"].lower()), None)
            if match:
                db.toggle_group_monitor(match["id"], True)
                return f"✅ Now monitoring: **{match['name']}**"
            return f"❌ Group not found: {args}. Try !sync then !groups."

        elif cmd == "!unmonitor":
            groups = db.get_all_groups()
            match = next((g for g in groups if args.lower() in g["name"].lower()), None)
            if match:
                db.toggle_group_monitor(match["id"], False)
                return f"⏹ Stopped monitoring: **{match['name']}**"
            return f"❌ Group not found: {args}"

        elif cmd == "!relay":
            try:
                from_part = args.split("from:")[1].split(" to:")[0].strip()
                to_part = args.split("to:")[1].split(" keywords:")[0].strip()
                keywords = args.split("keywords:")[1].strip() if "keywords:" in args else ""
                groups = db.get_all_groups()
                src = next((g for g in groups if from_part.lower() in g["name"].lower()), None)
                tgt = next((g for g in groups if to_part.lower() in g["name"].lower()), None)
                if src and tgt:
                    db.set_relay(src["id"], tgt["id"], keywords)
                    kw_msg = f" (keywords: {keywords})" if keywords else ""
                    return f"✅ Relay set: **{src['name']}** → **{tgt['name']}**{kw_msg}"
                return "❌ Could not find one or both groups."
            except Exception:
                return "❌ Format: !relay from:[Group A] to:[Group B]"

        elif cmd == "!broadcast":
            if "|" not in args:
                return "❌ Format: !broadcast [group name] | [your message]"
            group_name, message = args.split("|", 1)
            group_name = group_name.strip()
            message = message.strip()
            from agent.broadcaster import broadcast_to_group
            count = await broadcast_to_group(self.client, group_name, message)
            return f"✅ Message sent to {count} members in **{group_name}**"

        elif cmd == "!digest":
            from agent.digest import generate_digest
            digest = await generate_digest(self.config)
            await self.client.send_message("me", digest)
            return None

        elif cmd == "!scrape":
            from agent.extractor import extract_group_info
            result = await extract_group_info(self.client, args, self.config)
            return result

        elif cmd == "!media":
            from agent.media_scraper import scrape_group_media
            count = await scrape_group_media(self.client, args)
            return f"✅ Saved {count} media files from **{args}**"

        elif cmd == "!pause":
            feature = args.strip().lower()
            if feature == "all":
                self.paused_features = {"monitor", "relay", "broadcast", "media"}
            else:
                self.paused_features.add(feature)
            return f"⏸ Paused: **{feature}**"

        elif cmd == "!resume":
            feature = args.strip().lower()
            if feature == "all":
                self.paused_features.clear()
            else:
                self.paused_features.discard(feature)
            return f"▶️ Resumed: **{feature}**"

        return f"❓ Unknown command: {cmd}. Type !help for all commands."
