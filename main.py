"""
TELEGRAM AI AGENT — Main Entry Point
Runs both the Telegram agent and the FastAPI dashboard backend simultaneously
"""
import asyncio
import logging
import uvicorn
from threading import Thread
from config import Config
from agent.telegram_client import TelegramAgent
from api.routes import app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_api(port: int):
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")

async def main():
    config = Config()

    # Start API server in background thread
    api_thread = Thread(target=run_api, args=(config.PORT,), daemon=True)
    api_thread.start()
    logger.info(f"🌐 Dashboard API running on port {config.PORT}")

    # Start Telegram agent
    agent = TelegramAgent(config)
    logger.info("🤖 Starting Telegram AI Agent...")
    logger.info("📱 Send !help to your Saved Messages on Telegram to get started")
    await agent.start()

if __name__ == "__main__":
    asyncio.run(main())
