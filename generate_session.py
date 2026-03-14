"""
Run this ONCE on your phone (Termux) or any device to generate your
Telegram session string. Then paste the string into Railway env vars.

Install first:
  pip install telethon python-dotenv

Run:
  python generate_session.py
"""
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID = input("Enter your API_ID (from my.telegram.org): ").strip()
API_HASH = input("Enter your API_HASH (from my.telegram.org): ").strip()
PHONE = input("Enter your phone number (e.g. +2348012345678): ").strip()

async def generate():
    async with TelegramClient(StringSession(), int(API_ID), API_HASH) as client:
        await client.start(phone=PHONE)
        session_string = client.session.save()
        print("\n" + "="*60)
        print("✅ YOUR SESSION STRING (copy this into Railway env vars):")
        print("="*60)
        print(session_string)
        print("="*60)
        print("\nPaste this as TELEGRAM_SESSION_STRING in Railway dashboard")

asyncio.run(generate())
