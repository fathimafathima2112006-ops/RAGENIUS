"""Robust Groq client wrapper for RAGENIUS."""
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
FALLBACK_GROQ_MODEL = "llama-3.3-70b-versatile"
_client = None


class GroqConfigurationError(RuntimeError):
    pass


class GroqAuthenticationError(RuntimeError):
    pass


def _api_key():
    key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"').strip("'")
    if not key or key.lower() in {"your_groq_api_key_here", "your_api_key_here", "changeme"}:
        raise GroqConfigurationError(
            "Groq API key is not configured. Add a valid GROQ_API_KEY to the .env file and restart RAGENIUS."
        )
    return key


def _get_client():
    global _client
    key = _api_key()
    if _client is None:
        _client = Groq(api_key=key)
    return _client


def chat_groq(system_prompt, messages, model=None, max_tokens=1200, temperature=0.4, low_reasoning=False):
    """Chat completion with real multi-turn history.
    messages = [{"role": "user"|"assistant", "content": "..."}, ...]
    low_reasoning=True keeps gpt-oss reasoning short so small token budgets still return text."""
    model_name = (model or GROQ_MODEL)
    kwargs = {}
    if low_reasoning and "gpt-oss" in model_name.lower():
        kwargs["extra_body"] = {"reasoning_effort": "low"}
    payload = {
        "model": model_name,
        "messages": [{"role": "system", "content": system_prompt}] + list(messages),
        "max_tokens": max_tokens,
        "temperature": temperature,
        **kwargs,
    }
    try:
        completion = _get_client().chat.completions.create(**payload)
        return (completion.choices[0].message.content or "").strip()
    except Exception as exc:
        status = getattr(exc, "status_code", None)
        message = str(exc)
        lower = message.lower()
        if status == 401 or "invalid_api_key" in lower or "authentication" in lower:
            raise GroqAuthenticationError(
                "The Groq API key is invalid or expired. Set a valid GROQ_API_KEY in .env and restart RAGENIUS."
            ) from exc

        # Keep the app resilient when an old/deprecated model is configured.
        # Retry once with a known Groq production model instead of surfacing a
        # provider/model error to the user.
        model_error = status in {400, 404} or any(token in lower for token in (
            "model not found", "invalid model", "model_decommissioned", "does not exist", "unknown model"
        ))
        if model_error and model_name != FALLBACK_GROQ_MODEL:
            retry_payload = dict(payload)
            retry_payload["model"] = FALLBACK_GROQ_MODEL
            retry_payload.pop("extra_body", None)
            completion = _get_client().chat.completions.create(**retry_payload)
            return (completion.choices[0].message.content or "").strip()
        raise


def ask_groq(system_prompt, user_prompt, model=None, max_tokens=1200, temperature=0.4):
    return chat_groq(system_prompt, [{"role": "user", "content": user_prompt}], model=model, max_tokens=max_tokens, temperature=temperature)
