import logging
import base64
from github import Github
from agent.brain import ask_claude
from database import db
from config import Config

logger = logging.getLogger(__name__)

async def process_feature_request(request: str, config: Config) -> dict:
    """
    Takes a plain English feature request,
    generates code with Claude,
    commits it to GitHub,
    Railway auto-deploys the update.
    """
    try:
        # Save request to DB
        result = db.save_feature_request(request)
        req_id = result.data[0]["id"]

        # Ask Claude to write the code
        code = ask_claude(
            f"A user wants to add this feature to their Telegram AI Agent (Python/Telethon/FastAPI):\n\n"
            f'"{request}"\n\n'
            f"Write ONLY the Python code for this feature as a new module. "
            f"Include comments. Make it production-ready. "
            f"Return ONLY raw Python code, no markdown, no explanation.",
            config,
            system=(
                "You are an expert Python developer. You write clean, production-ready Python code. "
                "The app uses: Telethon (Telegram), FastAPI (API), Supabase (database), Anthropic Claude (AI). "
                "Return only valid Python code."
            )
        )

        # Push to GitHub
        gh = Github(config.GITHUB_TOKEN)
        repo = gh.get_repo(config.GITHUB_REPO)

        # Create a safe filename from request
        filename = "_".join(request.lower().split()[:5]).replace("/", "_") + ".py"
        filepath = f"agent/features/{filename}"

        commit_message = f"feat: {request[:60]}"

        try:
            # Check if file exists
            existing = repo.get_contents(filepath)
            repo.update_file(
                filepath,
                commit_message,
                code,
                existing.sha
            )
        except Exception:
            repo.create_file(filepath, commit_message, code)

        # Update status in DB
        db.update_feature_status(req_id, "deployed", commit_message)

        logger.info(f"✅ Feature deployed: {request[:50]}")
        return {
            "success": True,
            "message": f"✅ Feature built and pushed to GitHub. Railway will redeploy automatically.",
            "commit": commit_message,
            "file": filepath
        }

    except Exception as e:
        logger.error(f"Self-update error: {e}")
        return {
            "success": False,
            "message": f"❌ Error: {str(e)}"
        }
