from __future__ import annotations

import json
import os
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

from services.local_storage import get_local_json, remove_local_key, set_local_json

CONFIG_FILE = Path("config.json")
CONFIG_STORAGE_KEY = "porttion_portfolio_evaluation_config"
LEGACY_CONFIG_STORAGE_KEY = "vallet_manager_config"
DEFAULT_MODEL = "gpt-4o-mini"
MODEL_OPTIONS = ["gpt-4o-mini", "gpt-4o", "gpt-5"]
_INIT_FLAG = "_config_initialized"


def _load_file_config() -> dict:
    if not CONFIG_FILE.exists():
        return {}
    try:
        raw = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return raw if isinstance(raw, dict) else {}


def _save_file_config(config: dict) -> None:
    CONFIG_FILE.write_text(
        json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def init_config_state() -> None:
    if st.session_state.get(_INIT_FLAG):
        return

    load_dotenv()
    browser_config = get_local_json(CONFIG_STORAGE_KEY)
    legacy_browser_config = get_local_json(LEGACY_CONFIG_STORAGE_KEY)
    file_config = _load_file_config()
    persisted_config = (
        browser_config
        if isinstance(browser_config, dict)
        else legacy_browser_config if isinstance(legacy_browser_config, dict) else file_config
    )
    persisted_persistence = str(persisted_config.get("persistence", "")).lower()

    st.session_state["api_key"] = (
        st.session_state.get("api_key")
        or persisted_config.get("api_key")
        or os.getenv("OPENAI_API_KEY", "")
    )
    st.session_state["model"] = (
        st.session_state.get("model")
        or persisted_config.get("model")
        or os.getenv("OPENAI_MODEL")
        or DEFAULT_MODEL
    )
    st.session_state["config_persistence"] = (
        st.session_state.get("config_persistence")
        or (
            persisted_persistence
            if persisted_persistence in {"session", "localstorage", "local"}
            else ("localstorage" if isinstance(browser_config, dict) else "local" if file_config else "session")
        )
    )

    if isinstance(legacy_browser_config, dict) and not isinstance(browser_config, dict):
        set_local_json(
            CONFIG_STORAGE_KEY,
            {
                "api_key": st.session_state["api_key"],
                "model": st.session_state["model"],
                "persistence": st.session_state["config_persistence"],
            },
        )

    if not isinstance(browser_config, dict) and not isinstance(legacy_browser_config, dict) and file_config:
        set_local_json(
            CONFIG_STORAGE_KEY,
            {
                "api_key": st.session_state["api_key"],
                "model": st.session_state["model"],
                "persistence": st.session_state["config_persistence"],
            },
        )

    st.session_state[_INIT_FLAG] = True


def get_model_options() -> list[str]:
    return MODEL_OPTIONS.copy()


def get_config() -> dict:
    return {
        "api_key": st.session_state.get("api_key", ""),
        "model": st.session_state.get("model", DEFAULT_MODEL),
    }


def apply_config(api_key: str, model: str, persistence: str = "session") -> None:
    clean_key = api_key.strip()
    clean_model = model.strip() or DEFAULT_MODEL
    clean_persistence = persistence.strip().lower()
    if clean_persistence not in {"session", "localstorage", "local"}:
        clean_persistence = "localstorage"

    st.session_state["api_key"] = clean_key
    st.session_state["model"] = clean_model
    st.session_state["config_persistence"] = clean_persistence

    if clean_persistence in {"localstorage", "local"}:
        set_local_json(
            CONFIG_STORAGE_KEY,
            {"api_key": clean_key, "model": clean_model, "persistence": clean_persistence},
        )
        remove_local_key(LEGACY_CONFIG_STORAGE_KEY)
    else:
        remove_local_key(CONFIG_STORAGE_KEY)
        remove_local_key(LEGACY_CONFIG_STORAGE_KEY)

    if clean_persistence == "local":
        _save_file_config(
            {"api_key": clean_key, "model": clean_model, "persistence": clean_persistence}
        )
    elif CONFIG_FILE.exists():
        CONFIG_FILE.unlink()


def clear_local_config() -> None:
    remove_local_key(CONFIG_STORAGE_KEY)
    remove_local_key(LEGACY_CONFIG_STORAGE_KEY)
    if CONFIG_FILE.exists():
        CONFIG_FILE.unlink()
    st.session_state["api_key"] = ""
    st.session_state["model"] = DEFAULT_MODEL
    st.session_state["config_persistence"] = "session"
