import anthropic
from config import Config

def ask_claude(prompt: str, config: Config, system: str = None) -> str:
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    messages = [{"role": "user", "content": prompt}]
    kwargs = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 1024,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system
    response = client.messages.create(**kwargs)
    return response.content[0].text


def extract_key_info(messages: list, config: Config) -> str:
    if not messages:
        return "No messages to analyse."
    text_blob = "\n".join([
        f"[{m.get('sender', '?')}]: {m.get('text', '')}"
        for m in messages if m.get("text")
    ])[:8000]
    return ask_claude(
        f"From these Telegram messages, extract and list:\n"
        f"1. Important announcements\n2. Links shared\n3. Key decisions made\n"
        f"4. Resources or files mentioned\n5. Action items\n\nMessages:\n{text_blob}",
        config,
        system="You are an intelligent assistant helping extract key information from Telegram group messages. Be concise and structured."
    )


def summarise_for_digest(group_name: str, messages: list, config: Config) -> str:
    if not messages:
        return f"**{group_name}** — No activity today."
    text_blob = "\n".join([
        f"[{m.get('sender', '?')}]: {m.get('text', '')}"
        for m in messages if m.get("text")
    ])[:4000]
    summary = ask_claude(
        f"Summarise the key activity in this Telegram group today in 3-5 bullet points.\n\nGroup: {group_name}\nMessages:\n{text_blob}",
        config,
        system="Be concise. Use bullet points. Focus on what actually matters."
    )
    return f"**{group_name}**\n{summary}"


def detect_signal_type(text: str, config: Config) -> dict:
    """Detect if a message contains a trade signal or important alert"""
    result = ask_claude(
        f"Analyse this message. Reply ONLY in JSON like:\n"
        f'{{ "is_signal": true/false, "type": "trade/announcement/link/other", "summary": "one line summary" }}\n\n'
        f"Message: {text}",
        config,
        system="You are a signal detection AI. Only respond with the JSON object, nothing else."
    )
    import json
    try:
        return json.loads(result)
    except Exception:
        return {"is_signal": False, "type": "other", "summary": text[:100]}
