"""Robust Groq client wrapper for RAGENIUS.

Uses a currently supported Groq production model by default and gracefully
falls back when a configured model has been deprecated or is unavailable.
"""
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Groq deprecated llama-3.3-70b-versatile for developer/free usage on 2026-08-16.
# Keep the env variable configurable, but don't let an old value break the app.
_DEPRECATED_MODELS = {
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
}
_DEFAULT_MODEL = "openai/gpt-oss-120b"
_FALLBACK_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

_requested_model = os.environ.get("GROQ_MODEL", "").strip()
GROQ_MODEL = _DEFAULT_MODEL if not _requested_model or _requested_model in _DEPRECATED_MODELS else _requested_model
_client = None


class GroqConfigurationError(RuntimeError):
    pass


class GroqAuthenticationError(RuntimeError):
    pass


class GroqProviderError(RuntimeError):
    pass


def _api_key():
    key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"').strip("'")
    if not key or key.lower() in {"your_groq_api_key_here", "your_api_key_here", "changeme"}:
        raise GroqConfigurationError(
            "Groq API key is not configured. Add GROQ_API_KEY in Vercel Environment Variables and redeploy."
        )
    return key


def _get_client():
    global _client
    key = _api_key()
    if _client is None:
        _client = Groq(api_key=key)
    return _client


def _is_auth_error(exc):
    status = getattr(exc, "status_code", None)
    message = str(exc).lower()
    return status == 401 or "invalid_api_key" in message or "authentication" in message


def _is_model_error(exc):
    status = getattr(exc, "status_code", None)
    message = str(exc).lower()
    markers = ("model_not_found", "model does not exist", "decommissioned", "deprecated", "not available", "unknown model")
    return status in {400, 404, 403} and any(m in message for m in markers)


def _is_transient_error(exc):
    status = getattr(exc, "status_code", None)
    return status in {408, 409, 429, 500, 502, 503, 504}


def chat_groq(system_prompt, messages, model=None, max_tokens=1200, temperature=0.4, low_reasoning=False):
    """Return a chat completion, retrying with current models if needed."""
    client = _get_client()
    requested = (model or GROQ_MODEL).strip()
    candidates = [requested] + [m for m in _FALLBACK_MODELS if m != requested]
    last_exc = None

    for model_name in candidates:
        kwargs = {}
        if low_reasoning and "gpt-oss" in model_name.lower():
            kwargs["extra_body"] = {"reasoning_effort": "low"}
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "system", "content": system_prompt}] + list(messages),
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            )
            content = (completion.choices[0].message.content or "").strip()
            if content:
                return content
        except Exception as exc:
            last_exc = exc
            if _is_auth_error(exc):
                raise GroqAuthenticationError(
                    "The GROQ_API_KEY is invalid or expired. Update the Vercel Environment Variable and redeploy."
                ) from exc
            # Model retirement, rate limits and temporary provider failures should
            # try the next supported model before giving up.
            if _is_model_error(exc) or _is_transient_error(exc):
                continue
            # Some Groq SDK errors do not expose a status code. If the message
            # clearly indicates a temporary/model problem, also try the fallback.
            message = str(exc).lower()
            if any(term in message for term in ("timeout", "temporarily", "overloaded", "rate limit", "server error")):
                continue
            raise GroqProviderError(str(exc)) from exc

    if last_exc:
        raise GroqProviderError(str(last_exc)) from last_exc
    raise GroqProviderError("No Groq model returned an answer.")


def ask_groq(system_prompt, user_prompt, model=None, max_tokens=1200, temperature=0.4):
    return chat_groq(system_prompt, [{"role": "user", "content": user_prompt}], model=model, max_tokens=max_tokens, temperature=temperature)
